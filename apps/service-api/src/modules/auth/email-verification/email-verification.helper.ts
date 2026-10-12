import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import { Profile, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { MessageService } from '#/core/notification';
import { sendEmail, serviceWebUrl } from '#/modules/auth/auth-email.helper';

type ChallengeRecord = { userId: string, emailHash: string, token: string };

export async function sendEmailVerificationChallenge(em: AppEntityManager, kv: KvStore, messages: MessageService, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const key = `service:email-verification:${challengeId}`;
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, token } satisfies ChallengeRecord, TimeUtil.s.minute(SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes));
  const url = serviceWebUrl('/verify-email');
  url.searchParams.set('challengeId', challengeId);
  url.searchParams.set('token', token);
  await sendEmail(em, kv, messages, key, email, '서비스 이메일 인증', `아래 링크에서 이메일 인증을 완료해 주세요. 링크는 ${SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes}분 동안 유효합니다.\n${url.toString()}`);
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

function invalidEmailToken(): ApplicationError {
  return new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
}
