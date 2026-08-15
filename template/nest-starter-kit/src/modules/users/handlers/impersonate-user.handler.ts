import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { AccessTokenService, type AuthLevel } from '#/common/security/access-token.service';
import { AppEntityManager } from '#/database/entity-manager';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { ImpersonationTokenResponseDto, UserProfileResponseDto } from '#/modules/auth/dto';
import { ImpersonateUserCommand } from '#/modules/users/commands/impersonate-user.command';

@Injectable()
@CommandHandler(ImpersonateUserCommand)
export class ImpersonateUserHandler implements ICommandHandler<ImpersonateUserCommand, ImpersonationTokenResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly accessTokenService: AccessTokenService,
    private readonly cls: ClsService,
  ) {}

  async execute(command: ImpersonateUserCommand): Promise<ImpersonationTokenResponseDto> {
    this.verifySession();

    const user = await this.identify(command.id);
    this.verifyEligibility(user, command.currentUser.id);

    return this.process(user, command.currentUser.id);
  }

  private verifySession(): void {
    if (this.cls.get('impersonatedBy')) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identify(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyEligibility(user: User, currentUserId: string): void {
    if (
      user.id === currentUserId
      || user.isBanned
      || user.isDeleted
      || (user.role as RoleName) === RoleName.ADMIN
    ) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, currentUserId: string): Promise<ImpersonationTokenResponseDto> {
    return {
      userId: user.id,
      user: new UserProfileResponseDto(user),
      ...await this.accessTokenService.issueTokenPair(user.id, {
        authLevel: this.cls.get<AuthLevel>('authLevel'),
        impersonatedBy: currentUserId,
      }),
    };
  }
}
