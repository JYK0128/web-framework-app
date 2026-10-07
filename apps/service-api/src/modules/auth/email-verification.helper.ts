import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, isEncrypted } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import { SECURITY_CONFIG } from '#/app.config';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';

type ChallengeRecord = { userId: string, emailHash: string, token: string };
type EmailConfig = { from?: string, smtp?: { host?: string, port?: number, secure?: boolean, user?: string, pass?: string } };

export type PasswordResetRecord = { userId: string, emailHash: string, token: string };

export async function ensureEmailDeliveryConfigured(em: AppEntityManager): Promise<void> {
  serviceWebUrl('/verify-email');
  const config = await getEmailConfig(em);
  if (!hasEmailConfig(config)) {
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

export async function sendEmailVerificationChallenge(em: AppEntityManager, kv: KvStore, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const key = `service:email-verification:${challengeId}`;
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, token } satisfies ChallengeRecord, TimeUtil.s.minute(SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes));
  const url = serviceWebUrl('/verify-email');
  url.searchParams.set('challengeId', challengeId);
  url.searchParams.set('token', token);
  await sendEmail(em, kv, key, email, '서비스 이메일 인증', `아래 링크에서 이메일 인증을 완료해 주세요. 링크는 ${SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes}분 동안 유효합니다.\n${url.toString()}`);
}

export async function verifyEmailChallenge(em: AppEntityManager, kv: KvStore, challengeId: string, token: string): Promise<void> {
  const key = `service:email-verification:${challengeId}`;
  const pending = await kv.get<ChallengeRecord>(key);
  if (!pending || pending.token !== token) throw invalidEmailToken();
  const user = await em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
  if (!user || user.isDeleted) throw invalidEmailToken();
  const consumed = await kv.getAndDelete<ChallengeRecord>(key);
  if (!consumed || consumed.token !== token) throw invalidEmailToken();
  user.emailVerified = true;
  await em.flush();
}

export async function sendPasswordResetChallenge(em: AppEntityManager, kv: KvStore, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const ttlMinutes = SECURITY_CONFIG.token.passwordResetTokenTtlMinutes;
  const key = `service:password-reset:${challengeId}`;
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, token } satisfies PasswordResetRecord, TimeUtil.s.minute(ttlMinutes));
  const url = serviceWebUrl('/reset-password');
  url.searchParams.set('challengeId', challengeId);
  url.searchParams.set('token', token);
  await sendEmail(em, kv, key, email, '서비스 비밀번호 재설정', `아래 링크에서 비밀번호를 재설정해 주세요. 링크는 ${ttlMinutes}분 동안 유효합니다.\n${url.toString()}`);
}

async function sendEmail(em: AppEntityManager, kv: KvStore, challengeKey: string, email: string, subject: string, text: string): Promise<void> {
  const config = await getEmailConfig(em);
  if (!hasEmailConfig(config)) {
    await kv.del(challengeKey);
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
  const transport = createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure ?? false,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    connectionTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.connectionTimeoutSeconds),
    greetingTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.greetingTimeoutSeconds),
    socketTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.socketTimeoutSeconds),
  });
  try {
    await transport.sendMail({ from: config.from, to: email, subject, text });
  }
  catch {
    // The challenge is removed so a failed delivery cannot leave a usable unseen link.
    await kv.del(challengeKey);
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  }
  finally {
    transport.close();
  }
}

async function getEmailConfig(em: AppEntityManager): Promise<EmailConfig | null> {
  const entity = await em.findOne(SystemConfig, { code: 'delivery' }, { filters: false });
  if (typeof entity?.value !== 'object' || entity.value === null) return null;
  const config = (entity.value as { email?: EmailConfig }).email;
  if (!config?.smtp?.pass || !isEncrypted(config.smtp.pass)) return config ?? null;
  try {
    return { ...config, smtp: { ...config.smtp, pass: decrypt(config.smtp.pass, env.DELIVERY_EMAIL_ENCRYPTION_KEY) } };
  }
  catch {
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

function hasEmailConfig(config: EmailConfig | null): config is EmailConfig & { from: string, smtp: { host: string, port: number, user: string, pass: string } } {
  return !!config?.from && !!config.smtp?.host && !!config.smtp.port && !!config.smtp.user && !!config.smtp.pass;
}

function serviceWebUrl(path: string): URL {
  return new URL(path, env.APP_BASE_URL);
}

function invalidEmailToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
}
