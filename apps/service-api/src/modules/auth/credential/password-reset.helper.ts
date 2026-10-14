import { randomBytes, randomUUID } from 'node:crypto';

import { Logger } from '@nestjs/common';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { TimeUtil } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Profile, User } from '#/core/database/entities/auth';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { PasswordResetEmailEvent } from '#/modules/auth/credential/password-reset-email.event';

export type PasswordResetRecord = { userId: string, emailHash: string, emailEncrypted: string, token: string };
const logger = new Logger('PasswordResetHelper');

export async function sendPasswordResetChallenge(eventBroker: EventBroker, kv: KvStore, user: User, profile: Profile, email: string): Promise<void> {
  const challengeId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const ttlMinutes = SECURITY_CONFIG.token.passwordResetTokenTtlMinutes;
  const key = AuthKvStoreKey.passwordResetChallenge(challengeId);
  await kv.set(key, { userId: user.id, emailHash: profile.emailHash, emailEncrypted: encrypt(email, env.PII_ENCRYPTION_KEY), token } satisfies PasswordResetRecord, TimeUtil.s.minute(ttlMinutes));
  try {
    await eventBroker.publish(new PasswordResetEmailEvent(challengeId));
  }
  catch (error) {
    try { await kv.del(key); }
    catch (cleanupError) {
      logger.error(`Failed to remove password reset challenge after event publication failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    throw error;
  }
}
