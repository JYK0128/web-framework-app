import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import { assertPasswordCanBeUsed, updateCredentialPassword } from '#/core/auth/user/policy/password.policy';
import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { ResetPasswordCommand } from '#/modules/auth/commands';
import { ResetPasswordResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, ResetPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
  ) {}

  async execute({ input }: ResetPasswordCommand): Promise<ResetPasswordResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) throw invalidResetToken();
    const key = AuthKvStoreKey.passwordResetChallenge(input.challengeId);
    const pending = await this.kvStore.get<{ userId: string, emailHash: string, token: string }>(key);
    if (!pending || pending.token !== input.token) throw invalidResetToken();
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    if (!user || user.isDeleted) throw invalidResetToken();
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) throw invalidResetToken();
    await assertPasswordCanBeUsed(account, input.newPassword);
    const consumed = await this.kvStore.getAndDelete<{ token: string }>(key);
    if (!consumed || consumed.token !== input.token) throw invalidResetToken();
    await updateCredentialPassword(account, input.newPassword);
    user.updateMetadata({ failedLoginAttempts: 0, loginFailureWindowStartedAt: null, lockedUntil: null });
    await this.em.flush();
    return ResetPasswordResponseDto.parse({ ok: true });
  }
}

function invalidResetToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_PASSWORD_RESET_TOKEN', status: HttpStatus.BAD_REQUEST });
}
