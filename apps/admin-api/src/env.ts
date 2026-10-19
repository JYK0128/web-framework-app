import { z } from '@pkg/shared/common';
import { deriveSecretKey } from '@pkg/shared/server';

import { SECRET_KEY_PURPOSE } from './app.secret';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DEMO_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  PORT: z.coerce.number().int().positive(),

  APP_SECRET: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url-encoded 32-byte random key'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  LOKI_URL: z.url(),
  AWS_S3_BUCKET: z.string().trim().min(1).optional(),
  AWS_S3_REGION: z.string().trim().min(1).optional(),
  AWS_S3_ENDPOINT: z.url().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_SESSION_TOKEN: z.string().min(1).optional(),
  CDN_URL: z.url().optional(),

  SERVICE_API_URL: z.url(),
  PORTONE_API_SECRET: z.string().trim().min(1),
  APP_BASE_URL: z.url(),
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
  OAUTH_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.oauthClientSecretEncryption),
  TWO_FACTOR_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.twoFactorEncryption),
  ADMIN_EMAIL_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.adminEmailEncryption),
  PII_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiEncryption),
  PII_HASH_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiSearchHmac),
  MACHINE_JWT_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.machineJwtSigning),
};
