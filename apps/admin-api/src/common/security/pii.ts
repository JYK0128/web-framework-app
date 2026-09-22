import { decrypt, encrypt, hmac } from '@pkg/shared/server';

import { env } from '#/env';

export function protectEmail(value: string): { encrypted: string, hash: string } {
  return {
    encrypted: encrypt(value, env.PII_ENCRYPTION_KEY),
    hash: hmac(value, env.PII_HASH_KEY),
  };
}

export function revealPii(value: string): string {
  return decrypt(value, env.PII_ENCRYPTION_KEY);
}

export function hashEmail(value: string): string {
  return hmac(value, env.PII_HASH_KEY);
}

export function hashPhoneNumber(value: string): string {
  return hmac(value, env.PII_HASH_KEY);
}
