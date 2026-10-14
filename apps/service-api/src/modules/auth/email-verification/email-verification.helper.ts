import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Logger } from '@nestjs/common';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Profile, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { EmailVerificationEvent } from '#/modules/auth/email-verification/email-verification.event';

type ChallengeRecord = { userId: string, emailHash: string, emailEncrypted: string, token: string };
const logger = new Logger('EmailVerificationHelper');

export async function sendEmailVerificationChallenge(eventBroker: EventBroker, kv: KvStore, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const key = AuthKvStoreKey.emailVerificationChallenge(challengeId);
  const ttlMinutes = SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes;
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, emailEncrypted: encrypt(email, env.PII_ENCRYPTION_KEY), token } satisfies ChallengeRecord, TimeUtil.s.minute(ttlMinutes));
  try {
    await eventBroker.publish(new EmailVerificationEvent(challengeId, ttlMinutes));
  }
  catch (error) {
    try {
      await kv.del(key);
    }
    catch (cleanupError) {
      logger.error(`Failed to remove email challenge after event publication failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    throw error;
  }
}

export async function verifyEmailChallenge(em: AppEntityManager, kv: KvStore, challengeId: string, token: string): Promise<void> {
  const key = AuthKvStoreKey.emailVerificationChallenge(challengeId);
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
