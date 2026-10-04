import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, hmac } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { RequestPasswordResetCommand, ResetPasswordCommand } from '#/modules/auth/commands/password-recovery.command';
import { PasswordResetAcceptedDto, PasswordResetResponseDto } from '#/modules/auth/dto/registration.dto';
import { ensureEmailDeliveryConfigured, type PasswordResetRecord, sendPasswordResetChallenge } from '#/modules/auth/email-verification.helper';
import { assertPasswordCanBeUsed, updateCredentialPassword } from '#/modules/auth/password-policy';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, PasswordResetAcceptedDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}

  async execute(command: RequestPasswordResetCommand): Promise<PasswordResetAcceptedDto> {
    await ensureEmailDeliveryConfigured(this.em);
    const email = command.input.email.trim().toLowerCase();
    const user = await this.em.findOne(User, { profile: { emailHash: hmac(email, env.PII_HASH_KEY), phoneNumberHash: hmac(command.input.phoneNumber, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
      if (account?.password) {
        await sendPasswordResetChallenge(this.em, this.kv, user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
      }
    }
    return PasswordResetAcceptedDto.fromPlain({ accepted: true });
  }
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, PasswordResetResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}

  async execute(command: ResetPasswordCommand): Promise<PasswordResetResponseDto> {
    const { challengeId, token, newPassword } = command.input;
    const key = `service:password-reset:${challengeId}`;
    const pending = await this.kv.get<PasswordResetRecord>(key);
    if (!pending || pending.token !== token) throw invalidToken();
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    const account = user && await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!user || user.isDeleted || !account?.password) throw invalidToken();

    await assertPasswordCanBeUsed(account, newPassword);
    const consumed = await this.kv.getAndDelete<PasswordResetRecord>(key);
    if (!consumed || consumed.token !== token) throw invalidToken();
    await updateCredentialPassword(account, newPassword);
    user.updateMetadata({ failedLoginAttempts: 0, loginFailureWindowStartedAt: null, lockedUntil: null });
    await this.em.flush();
    return PasswordResetResponseDto.fromPlain({ ok: true });
  }
}

function invalidToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_PASSWORD_RESET_TOKEN', status: HttpStatus.BAD_REQUEST, message: '비밀번호 재설정 링크가 유효하지 않거나 만료됐습니다.' });
}
