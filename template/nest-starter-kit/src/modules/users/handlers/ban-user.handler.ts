import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isAfter } from 'date-fns';

import { SessionStore } from '#/common/stores/session.store';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { BanUserCommand } from '#/modules/users/commands/ban-user.command';
import { BanUserRequestDto, BanUserResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand, BanUserResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: BanUserCommand): Promise<BanUserResponseDto> {
    const user = await this.identifyUser(command.input.id);
    this.verifyEligibility(user, command.input.currentUserId);
    this.verifyExpiration(command.input.input.expiresAt);

    return this.process(user, command.input.input);
  }

  private async identifyUser(id: string): Promise<User> {
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
    if (!expiresAt || !isAfter(expiresAt, new Date())) {
      throw new ApplicationError({ code: 'INVALID_BAN_EXPIRATION', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, input: BanUserRequestDto): Promise<BanUserResponseDto> {
    user.banned = true;
    user.banReason = input.reason?.trim() || null;
    user.banExpires = input.expiresAt ?? null;
    await this.sessionStore.destroyAll(user.id);

    return { ok: true };
  }
}
