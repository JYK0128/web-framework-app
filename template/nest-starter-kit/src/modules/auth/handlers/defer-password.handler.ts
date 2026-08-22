import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { Account } from '#/entities/auth/account.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeferPasswordCommand } from '#/modules/auth/commands/defer-password.command';
import { PASSWORD_CHANGE_DEFER_DAYS } from '#/modules/auth/constants/auth-policy.constants';
import { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

@Injectable()
@CommandHandler(DeferPasswordCommand)
export class DeferPasswordHandler implements ICommandHandler<DeferPasswordCommand, DeferPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_command: DeferPasswordCommand): Promise<DeferPasswordResponseDto> {
    const userId = this.identifyUserId();
    const account = await this.identifyAccount(userId);

    return this.process(account);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
    });

    if (!account) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }

    return account;
  }

  private async process(account: Account): Promise<DeferPasswordResponseDto> {
    const deferredUntil = new Date();
    deferredUntil.setDate(deferredUntil.getDate() + PASSWORD_CHANGE_DEFER_DAYS);

    account.updateMetadata({
      passwordChangeDeferredUntil: deferredUntil,
    });

    return { ok: true };
  }
}
