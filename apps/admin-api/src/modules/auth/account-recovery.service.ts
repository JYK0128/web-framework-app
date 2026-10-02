import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { assertPasswordCanBeUsed, updateCredentialPassword } from '#/modules/auth/password-policy';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

type ResetRecord = { userId: string, emailHash: string, token: string };
type EmailVerificationRecord = { userId: string, emailHash: string, token: string };

@Injectable()
export class AccountRecoveryService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async findIds(name: string, phoneNumber: string) {
    const users = await this.em.find(User, { profile: { name: name.trim(), phoneNumberHash: hmac(phoneNumber, env.PII_HASH_KEY) } }, { populate: ['profile'] });
    if (users.length === 0) return { items: [] };
    const accounts = await this.em.find(Account, { user: { $in: users.map(({ id }) => id) } });
    const accountProvidersByUser = new Map<string, string[]>();
    for (const account of accounts) {
      const providers = accountProvidersByUser.get(account.user.id) ?? [];
      providers.push(account.providerId);
      accountProvidersByUser.set(account.user.id, providers);
    }
    return {
      items: users.flatMap((user) => {
        const profile = user.profile;
        if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
        const maskedEmail = this.maskEmail(decrypt(profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
        return (accountProvidersByUser.get(user.id) ?? []).map((provider) => ({ maskedEmail, provider }));
      }),
    };
  }

  async requestEmailVerification(email: string): Promise<{ accepted: true }> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return { accepted: true };
    await this.systemConfig.ensureEmailDeliveryConfigured();

    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = hmac(normalizedEmail, env.PII_HASH_KEY);
    const user = await this.em.findOne(User, { profile: { emailHash } }, { filters: false });
    if (!user || user.isDeleted || user.emailVerified) return { accepted: true };

    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const key = `admin:email-verification:${challengeId}`;
    const ttlMinutes = SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes;
    await this.kvStore.set(key, { userId: user.id, emailHash, token } satisfies EmailVerificationRecord, TimeUtil.s.minute(ttlMinutes));
    const verificationUrl = new URL('/verify-email', env.APP_BASE_URL);
    verificationUrl.searchParams.set('challengeId', challengeId);
    verificationUrl.searchParams.set('token', token);
    try {
      await this.systemConfig.sendEmailVerificationEmail(normalizedEmail, verificationUrl.toString(), ttlMinutes);
    }
    catch (error) {
      await this.kvStore.del(key);
      throw error;
    }
    return { accepted: true };
  }

  async verifyEmail(challengeId: string, token: string): Promise<{ emailVerified: true }> {
    const key = `admin:email-verification:${challengeId}`;
    const pending = await this.kvStore.get<EmailVerificationRecord>(key);
    if (!pending || pending.token !== token) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: 400, message: '이메일 인증 링크가 유효하지 않거나 만료됐습니다.' });
    }
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    if (!user || user.isDeleted) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: 400, message: '이메일 인증 링크가 유효하지 않거나 만료됐습니다.' });
    }
    const consumed = await this.kvStore.getAndDelete<EmailVerificationRecord>(key);
    if (!consumed || consumed.token !== token) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: 400, message: '이메일 인증 링크가 이미 사용됐거나 만료됐습니다.' });
    }
    user.emailVerified = true;
    await this.em.flush();
    return { emailVerified: true };
  }

  async requestPasswordReset(email: string, phoneNumber: string): Promise<{ accepted: true }> {
    await this.systemConfig.ensureEmailDeliveryConfigured();
    const emailHash = hmac(email.trim().toLowerCase(), env.PII_HASH_KEY);
    const user = await this.em.findOne(User, {
      profile: { emailHash, phoneNumberHash: hmac(phoneNumber, env.PII_HASH_KEY) },
    }, { filters: false });
    if (!user || user.isDeleted) return { accepted: true };
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) return { accepted: true };

    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const key = `admin:password-reset:${challengeId}`;
    await this.kvStore.set(key, { userId: user.id, emailHash, token } satisfies ResetRecord,
      TimeUtil.s.minute(SECURITY_CONFIG.token.passwordResetTokenTtlMinutes));
    const resetUrl = new URL('/reset-password', env.APP_BASE_URL);
    resetUrl.searchParams.set('challengeId', challengeId);
    resetUrl.searchParams.set('token', token);
    try {
      await this.systemConfig.sendPasswordResetEmail(email.trim().toLowerCase(), resetUrl.toString());
    }
    catch (error) {
      await this.kvStore.del(key);
      throw error;
    }
    return { accepted: true };
  }

  async resetPassword(challengeId: string, token: string, newPassword: string): Promise<{ ok: true }> {
    const key = `admin:password-reset:${challengeId}`;
    const pending = await this.kvStore.get<ResetRecord>(key);
    if (!pending || pending.token !== token) throw invalidResetToken();
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    if (!user || user.isDeleted) throw invalidResetToken();
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) throw invalidResetToken();
    await assertPasswordCanBeUsed(account, newPassword);

    const consumed = await this.kvStore.getAndDelete<ResetRecord>(key);
    if (!consumed || consumed.token !== token) throw invalidResetToken();
    await updateCredentialPassword(account, newPassword);
    user.updateMetadata({ failedLoginAttempts: 0, loginFailureWindowStartedAt: null, lockedUntil: null });
    await this.em.flush();
    return { ok: true };
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
  }
}

function invalidResetToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_PASSWORD_RESET_TOKEN', status: HttpStatus.BAD_REQUEST, message: '비밀번호 재설정 링크가 유효하지 않거나 만료됐습니다.' });
}
