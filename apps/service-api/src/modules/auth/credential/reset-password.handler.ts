import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { assertPasswordCanBeUsed, updateCredentialPassword } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { KvStore } from '@pkg/server-core/kv-store';
import { ApplicationError } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '~/app.config';
import { Account, User } from '~/core/database/entities/auth';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { ResetPasswordCommand } from '~/modules/auth/credential/reset-password.command';
import { ResetPasswordResponseDto } from '~/modules/auth/credential/reset-password.response.dto';

type PasswordResetRecord = { userId: string, emailHash: string, emailEncrypted: string, token: string };

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, ResetPasswordResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) throw invalidToken();
    const { challengeId, token, newPassword } = command.input;
    const key = AuthKvStoreKey.passwordResetChallenge(challengeId);
    const pending = await this.kv.get<PasswordResetRecord>(key);
    if (!pending || pending.token !== token) throw invalidToken();
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    const account = user && await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!user || user.isDeleted || !account?.password) throw invalidToken();

    await assertPasswordCanBeUsed(account, newPassword, SECURITY_CONFIG.password);
    const consumed = await this.kv.getAndDelete<PasswordResetRecord>(key);
    if (!consumed || consumed.token !== token) throw invalidToken();
    await updateCredentialPassword(account, newPassword, SECURITY_CONFIG.password);
    user.updateMetadata({ failedLoginAttempts: 0, loginFailureWindowStartedAt: null, lockedUntil: null });
    await this.em.flush();
    return ResetPasswordResponseDto.ok();
  }
}

function invalidToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_PASSWORD_RESET_TOKEN', status: HttpStatus.BAD_REQUEST });
}
