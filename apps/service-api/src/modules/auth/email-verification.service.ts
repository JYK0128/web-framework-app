import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, isEncrypted } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/entities/auth/user.entity';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';

type VerificationRecord = { userId: string, emailHash: string, token: string };
export type PasswordResetRecord = { userId: string, emailHash: string, token: string };
type EmailConfig = { from?: string, smtp?: { host?: string, port?: number, secure?: boolean, user?: string, pass?: string } };

@Injectable()
export class EmailVerificationService {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}

  async ensureConfigured(): Promise<void> {
    this.getServiceWebUrl('/verify-email');
    const config = await this.getConfig();
    if (!config?.from || !config.smtp?.host || !config.smtp.port || !config.smtp.user || !config.smtp.pass) {
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    }
  }

  async send(user: User, email: string): Promise<void> {
    await this.ensureConfigured();
    const config = await this.getConfig();
    if (!config?.from || !config.smtp?.host || !config.smtp.port || !config.smtp.user || !config.smtp.pass) return;

    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const expiresInSeconds = TimeUtil.s.minute(SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes);
    await this.kv.set(`service:email-verification:${challengeId}`, { userId: user.id, emailHash: user.emailHash, token } satisfies VerificationRecord, expiresInSeconds);
    const url = this.getServiceWebUrl('/verify-email');
    url.searchParams.set('challengeId', challengeId);
    url.searchParams.set('token', token);

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
      await transport.sendMail({
        from: config.from,
        to: email,
        subject: '서비스 이메일 인증',
        text: `아래 링크에서 이메일 인증을 완료해 주세요. 링크는 ${SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes}분 동안 유효합니다.\n${url.toString()}`,
      });
    }
    catch {
      await this.kv.del(`service:email-verification:${challengeId}`);
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    finally {
      transport.close();
    }
  }

  async verify(challengeId: string, token: string): Promise<void> {
    const key = `service:email-verification:${challengeId}`;
    const pending = await this.kv.get<VerificationRecord>(key);
    if (!pending || pending.token !== token) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
    const user = await this.em.findOne(User, { id: pending.userId, emailHash: pending.emailHash }, { filters: false });
    if (!user) throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    if (!user.emailVerified) user.emailVerified = true;
    await this.em.flush();
    const consumed = await this.kv.getAndDelete<VerificationRecord>(key);
    if (!consumed || consumed.token !== token) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
  }

  async sendPasswordReset(user: User, email: string): Promise<void> {
    await this.ensureConfigured();
    const config = await this.getConfig();
    if (!config?.from || !config.smtp?.host || !config.smtp.port || !config.smtp.user || !config.smtp.pass) return;
    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const ttlMinutes = SECURITY_CONFIG.token.passwordResetTokenTtlMinutes;
    const key = `service:password-reset:${challengeId}`;
    await this.kv.set(key, { userId: user.id, emailHash: user.emailHash, token } satisfies PasswordResetRecord, TimeUtil.s.minute(ttlMinutes));
    const url = this.getServiceWebUrl('/reset-password');
    url.searchParams.set('challengeId', challengeId);
    url.searchParams.set('token', token);
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
      await transport.sendMail({
        from: config.from,
        to: email,
        subject: '서비스 비밀번호 재설정',
        text: `아래 링크에서 비밀번호를 재설정해 주세요. 링크는 ${ttlMinutes}분 동안 유효합니다.\n${url.toString()}`,
      });
    }
    catch {
      await this.kv.del(key);
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    finally {
      transport.close();
    }
  }

  private async getConfig(): Promise<EmailConfig | null> {
    const entity = await this.em.findOne(SystemConfig, { code: 'delivery' }, { filters: false });
    if (typeof entity?.value !== 'object' || entity.value === null) return null;
    const config = (entity.value as { email?: EmailConfig }).email;
    if (!config?.smtp?.pass || !isEncrypted(config.smtp.pass)) return config ?? null;
    try {
      return { ...config, smtp: { ...config.smtp, pass: decrypt(config.smtp.pass, env.APP_SECRET) } };
    }
    catch {
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, message: '이메일 발송 설정을 읽을 수 없습니다.' });
    }
  }

  private getServiceWebUrl(path: string): URL {
    if (!env.SERVICE_WEB_URL) {
      throw new ApplicationError({ code: 'SERVICE_WEB_URL_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, message: '서비스 웹 주소가 설정되지 않았습니다.' });
    }
    return new URL(path, env.SERVICE_WEB_URL);
  }
}
