import { randomBytes, randomUUID } from 'node:crypto';

import { TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import { Profile, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { MessageService } from '#/core/notification';
import { sendEmail, serviceWebUrl } from '#/modules/auth/auth-email.helper';

export type PasswordResetRecord = { userId: string, emailHash: string, token: string };

export async function sendPasswordResetChallenge(em: AppEntityManager, kv: KvStore, messages: MessageService, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const ttlMinutes = SECURITY_CONFIG.token.passwordResetTokenTtlMinutes;
  const key = `service:password-reset:${challengeId}`;
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, token } satisfies PasswordResetRecord, TimeUtil.s.minute(ttlMinutes));
  const url = serviceWebUrl('/reset-password');
  url.searchParams.set('challengeId', challengeId);
  url.searchParams.set('token', token);
  await sendEmail(em, kv, messages, key, email, '서비스 비밀번호 재설정', `아래 링크에서 비밀번호를 재설정해 주세요. 링크는 ${ttlMinutes}분 동안 유효합니다.\n${url.toString()}`);
}
