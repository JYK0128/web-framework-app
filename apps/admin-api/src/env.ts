import { z } from '@pkg/shared/common';
import { deriveSecretKey } from '@pkg/shared/server';

import { SECRET_KEY_PURPOSE } from './key-purpose';

const envSchema = z.object({
  // Process identity and runtime
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),

  // Required runtime infrastructure and security
  APP_SECRET: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url-encoded 32-byte random key'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // Required machine integration
  SERVICE_API_URL: z.url(),
  ADMIN_WEB_URL: z.url(),
  PORTONE_API_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid admin-api environment variables:', parsed.error.issues);
  throw new Error('Invalid admin-api environment variables');
}

const { APP_SECRET: rootSecret, ...config } = parsed.data;

// APP_SECRET is the only configured root; each operation gets a purpose-specific key.
export const env = {
  ...config,
  USER_JWT_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.userJwtSigning),
  SESSION_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.sessionSigning),
  TWO_FACTOR_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.twoFactorEncryption),
  ADMIN_EMAIL_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.adminEmailEncryption),
  PII_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiEncryption),
  PII_HASH_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiSearchHmac),
  MACHINE_JWT_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.machineJwtSigning),
};
