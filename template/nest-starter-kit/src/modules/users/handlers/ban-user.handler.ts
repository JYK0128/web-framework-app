import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isAfter } from 'date-fns';

import { AuthCacheService } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { BanUserCommand } from '#/modules/users/commands/ban-user.command';
import { BanUserRequestDto, UserDetailDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand, UserDetailDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly authCacheService: AuthCacheService,
  ) {}

  async execute(command: BanUserCommand): Promise<UserDetailDto> {
    const user = await this.identify(command.id);
    this.verifyEligibility(user, command.currentUserId);
    this.verifyExpiration(command.input.expiresAt);

    return this.process(user, command.input);
  }

  private async identify(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyEligibility(user: User, currentUserId: string): void {
    if (user.id === currentUserId) {
      throw new ApplicationError({ code: 'USER_SELF_ACTION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'USER_DELETED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private verifyExpiration(expiresAt?: Date | null): void {
    if (expiresAt && !isAfter(expiresAt, new Date())) {
      throw new ApplicationError({ code: 'INVALID_BAN_EXPIRATION', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, input: BanUserRequestDto): Promise<UserDetailDto> {
    user.banned = true;
    user.banReason = input.reason?.trim() || null;
    user.banExpires = input.expiresAt ?? null;

    await this.authCacheService.invalidateUserState(user.id);

    const accounts = await this.em.find(Account, { user: user.id }, { filters: false });
    return new UserDetailDto(user, accounts);
  }
}
