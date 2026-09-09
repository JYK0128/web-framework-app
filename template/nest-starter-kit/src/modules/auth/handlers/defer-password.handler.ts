import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeferPasswordCommand } from '#/modules/auth/commands/defer-password.command';
import { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

@Injectable()
@CommandHandler(DeferPasswordCommand)
export class DeferPasswordHandler implements ICommandHandler<DeferPasswordCommand, DeferPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(_command: DeferPasswordCommand): Promise<DeferPasswordResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const account = await this.identifyAccount(userId);
    this.verify(account);

    return this.process(account);
  }

  private verify(account: Account): void {
    if (!account) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }
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
    const policy = await this.systemContext.getAuthPolicy();
    const deferredUntil = new Date();
    deferredUntil.setDate(deferredUntil.getDate() + policy.passwordChangeDeferDays);

    account.updateMetadata({
      passwordChangeDeferredUntil: deferredUntil,
    });

    return { ok: true };
  }
}
