import { randomBytes, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';

type ResetRecord = { userId: string, token: string };

@Injectable()
export class AccountRecoveryService {
  constructor(private readonly em: AppEntityManager, private readonly kvStore: KvStore) {}
  async findIds(name: string, phoneNumber: string) {
    const users = await this.em.find(User, { name: name.trim() }, { populate: ['profile'] });
    const matched = users.filter((user) => user.profile?.phoneNumber === phoneNumber.trim());
    return { items: matched.map((user) => ({ maskedEmail: this.maskEmail(user.email), provider: Account.PROVIDER_CREDENTIAL })) };
  }

  async requestPasswordReset(email: string, phoneNumber: string) {
    const user = await this.em.findOne(
      User,
      { email: email.trim().toLowerCase() },
      { populate: ['profile'] },
    );
    if (user && user.profile?.phoneNumber === phoneNumber.trim()) {
      const challengeId = randomUUID();
      const token = randomBytes(32).toString('base64url');
      await this.kvStore.set(`admin:password-reset:${challengeId}`, { userId: user.id, token } satisfies ResetRecord, 900);
      const link = `${process.env.ADMIN_WEB_URL ?? 'http://localhost:13000'}/reset-password?challengeId=${challengeId}&token=${token}`;
      await this.sendEmail(user.email, link);
    }
  }

  async verifyPasswordReset(challengeId: string, token: string) {
    const record = await this.kvStore.get<ResetRecord>(`admin:password-reset:${challengeId}`);
    return { isValid: Boolean(record && record.token === token) };
  }

  async resetPassword(challengeId: string, token: string, newPassword: string) {
    const record = await this.kvStore.getAndDelete<ResetRecord>(`admin:password-reset:${challengeId}`);
    if (!record || record.token !== token) throw new ApplicationError({ code: 'INVALID_RESET_TOKEN', status: 400, message: '유효하지 않거나 만료된 재설정 링크입니다.' });
    const account = await this.em.findOne(Account, { user: record.userId, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account) throw new ApplicationError({ code: 'PASSWORD_ACCOUNT_NOT_FOUND', status: 400, message: '비밀번호 계정을 찾을 수 없습니다.' });
    account.password = await hash(newPassword);
    const user = await this.em.findOne(User, { id: record.userId });
    user?.updateMetadata({ failedLoginAttempts: 0, lockedUntil: null });
    await this.em.flush();
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
  }

  private async sendEmail(to: string, link: string) {
    const { SMTP_HOST: host, SMTP_PORT, SMTP_USER: user, SMTP_PASS: pass, SMTP_FROM: from } = process.env;
    if (!host || !SMTP_PORT || !user || !pass) return;
    await createTransport({ host, port: Number(SMTP_PORT), secure: process.env.SMTP_SECURE === 'true', auth: { user, pass } }).sendMail({ from: from ?? user, to, subject: '[Admin] 비밀번호 재설정', text: `비밀번호 재설정 링크: ${link}` });
  }
}
