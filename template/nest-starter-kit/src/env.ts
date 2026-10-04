import { z } from '@pkg/shared/common';
import { deriveSecretKey } from '@pkg/shared/server';

import { SECRET_KEY_PURPOSE } from './key-purpose';

const envSchema = z.object({
  // 1. Application & Core Secrets
  APP_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  PORT: z.coerce.number().int().positive().optional(),
  APP_SECRET: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url-encoded 32-byte random key'),

  // 2. Databases & Caching
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // 3. Service URLs & Telemetry
  FRONTEND_URL: z.url(),
  LOKI_URL: z.url(),

  // 4. External Services
  PORTONE_API_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  throw new Error('Invalid environment variables');
}

// APP_SECRET is the only configured root; each operation gets a purpose-specific key.
const { APP_SECRET: rootSecret, ...config } = parsed.data;

export const env = {
  ...config,
  SESSION_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.sessionSigning),
  SYSTEM_CONFIG_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.systemConfigEncryption),
  VERIFICATION_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.verificationEncryption),
  TWO_FACTOR_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.twoFactorEncryption),
  APP_HASH_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.emailLogHmac),
  PORT: config.PORT ?? config.BACKEND_PORT,
};
export type Env = typeof env;
