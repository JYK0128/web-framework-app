import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { hash, randomBase64Url } from '@pkg/shared/server';
import { isAfter } from 'date-fns';
import { ClsService } from 'nestjs-cls';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AccessTokenService, type AuthLevel } from '#/common/security/access-token.service';
import { AppEntityManager } from '#/database/entity-manager';
import { ROLE_NAMES } from '#/entities/auth.extentions/role.entity';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { ImpersonationTokenResponseDto, UserProfileResponseDto } from '#/modules/auth/dto';

import { BanUserRequestDto, GetUsersRequestDto, GetUsersResponseDto, ResetPasswordResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto, UserDetailDto, UserItemDto, UserOverviewDto } from './dto';

const CREDENTIAL_PROVIDER = 'credential';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
    private readonly accessTokenService: AccessTokenService,
    private readonly cls: ClsService,
  ) {}

  @Permission('user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    const pageOptions = query.toPageOptions();
    const pageResult = await this.em.findByPage(
      User,
      query.toFilterQuery(),
      {
        ...pageOptions,
        ...(query.includeDeleted ? { filters: false } : {}),
      },
    );

    const items: UserItemDto[] = pageResult.items.map((user) => new UserItemDto(user));

    return {
      ...pageResult,
      items,
    };
  }

  @Permission('user:read')
  @Get('overview')
  @SwaggerApiResponse(UserOverviewDto)
  async getUserOverview(): Promise<UserOverviewDto> {
    const [totalUsers, adminUsers, twoFactorEnabledUsers] = await Promise.all([
      this.em.count(User, {}),
      this.em.count(User, { role: ROLE_NAMES.ADMIN }),
      this.em.count(User, { twoFactorEnabled: true }),
    ]);

    return {
      totalUsers,
      adminUsers,
      twoFactorEnabledUsers,
      regularUsers: Math.max(0, totalUsers - adminUsers),
    };
  }

  @Permission('user:read')
  @Get(':id')
  @SwaggerApiResponse(UserDetailDto)
  async getUserById(@Param('id') id: string): Promise<UserDetailDto> {
    return this.getUserDetailDto(await this.requireUser(id));
  }

  @Permission('user:update')
  @Post(':id/ban')
  @SwaggerApiResponse(UserDetailDto)
  async banUser(
    @Param('id') id: string,
    @Body() input: BanUserRequestDto,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    const user = await this.requireUser(id);
    this.assertNotSelf(user, currentUser);
    this.assertNotDeleted(user);

    const banExpires = input.expiresAt ?? null;
    if (input.expiresAt && !banExpires) {
      throw new ApplicationError({ code: 'INVALID_BAN_EXPIRATION', status: HttpStatus.BAD_REQUEST });
    }
    if (banExpires && !isAfter(banExpires, new Date())) {
      throw new ApplicationError({ code: 'INVALID_BAN_EXPIRATION', status: HttpStatus.BAD_REQUEST });
    }

    user.banned = true;
    user.banReason = input.reason?.trim() || null;
    user.banExpires = banExpires;
    await this.em.flush();

    return this.getUserDetailDto(user);
  }

  @Permission('user:update')
  @Post(':id/unban')
  @SwaggerApiResponse(UserDetailDto)
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    const user = await this.requireUser(id);
    this.assertNotSelf(user, currentUser);
    this.assertNotDeleted(user);

    user.banned = false;
    user.banReason = null;
    user.banExpires = null;
    await this.em.flush();

    return this.getUserDetailDto(user);
  }

  @Permission('user:delete')
  @Delete(':id')
  @SwaggerApiResponse(UserDetailDto)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    const user = await this.requireUser(id);
    this.assertNotSelf(user, currentUser);

    if (!user.isDeleted) {
      user.deletedAt = new Date();
      user.deletedBy = currentUser.id;
      await this.em.flush();
    }

    return this.getUserDetailDto(user);
  }

  @Permission('user:delete')
  @Post(':id/restore')
  @SwaggerApiResponse(UserDetailDto)
  async restoreUser(@Param('id') id: string): Promise<UserDetailDto> {
    const user = await this.requireUser(id);
    if (user.isDeleted) {
      user.deletedAt = null;
      user.deletedBy = null;
      await this.em.flush();
    }

    return this.getUserDetailDto(user);
  }

  @Permission('user:update')
  @Patch(':id/role')
  @SwaggerApiResponse(UserDetailDto)
  async updateUserRole(
    @Param('id') id: string,
    @Body() input: UpdateUserRoleRequestDto,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    const user = await this.requireUser(id);
    this.assertNotSelf(user, currentUser);
    this.assertNotDeleted(user);

    user.role = input.role;
    await this.em.flush();

    return this.getUserDetailDto(user);
  }

  @Permission('user:update')
  @Post(':id/password/reset')
  @SwaggerApiResponse(ResetPasswordResponseDto)
  async resetUserPassword(@Param('id') id: string): Promise<ResetPasswordResponseDto> {
    const user = await this.requireUser(id);
    this.assertNotDeleted(user);

    const account = await this.em.findOne(Account, {
      user: user.id,
      accountId: user.id,
      providerId: CREDENTIAL_PROVIDER,
    }, { filters: false });
    const temporaryPassword = `Aa1!${randomBase64Url(12)}`;
    const newHashedPassword = await hash(temporaryPassword);
    const history = account?.metadata?.passwordHistory || [];
    const updatedHistory = [newHashedPassword, ...history].slice(0, 3);

    if (account) {
      account.password = newHashedPassword;
      account.updateMetadata({
        failedLoginAttempts: null,
        lockedUntil: null,
        passwordUpdatedAt: new Date(),
        passwordChangeDeferredUntil: null,
        passwordResetRequired: true,
        passwordHistory: updatedHistory,
      });
    }
    else {
      const credentialAccount = this.em.create(Account, {
        user,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
        password: newHashedPassword,
        metadata: {
          passwordUpdatedAt: new Date(),
          passwordResetRequired: true,
          passwordHistory: updatedHistory,
        },
      });
      this.em.persist(credentialAccount);
    }

    await this.em.flush();

    return { temporaryPassword };
  }

  @Permission('user:update')
  @Post(':id/2fa/reset')
  @SwaggerApiResponse(UserActionResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<UserActionResponseDto> {
    const user = await this.requireUser(id);
    this.assertNotDeleted(user);

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    await this.em.flush();

    return { ok: true };
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return user;
  }

  private assertNotSelf(user: User, currentUser: UserProfileResponseDto): void {
    if (user.id === currentUser.id) {
      throw new ApplicationError({ code: 'USER_SELF_ACTION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private assertNotDeleted(user: User): void {
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'USER_DELETED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async getUserDetailDto(user: User): Promise<UserDetailDto> {
    const accounts = await this.em.find(Account, { user: user.id }, { filters: false });
    return new UserDetailDto(user, accounts);
  }

  @Permission('user:update')
  @Post(':id/impersonate')
  @SwaggerApiResponse(ImpersonationTokenResponseDto)
  async impersonateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<ImpersonationTokenResponseDto> {
    if (this.cls.get('impersonatedBy')) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    const targetUser = await this.em.findOne(User, { id }, { filters: false });
    if (!targetUser) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (
      targetUser.id === currentUser.id
      || targetUser.isBanned
      || targetUser.isDeleted
      || targetUser.role?.toString() === ROLE_NAMES.ADMIN
    ) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    return {
      userId: targetUser.id,
      user: new UserProfileResponseDto(targetUser),
      ...await this.accessTokenService.issueTokenPair(targetUser.id, {
        authLevel: this.cls.get<AuthLevel>('authLevel'),
        impersonatedBy: currentUser.id,
      }),
    };
  }
}
