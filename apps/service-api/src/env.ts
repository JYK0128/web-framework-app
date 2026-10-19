import { z } from '@pkg/shared/common';
import { deriveSecretKey } from '@pkg/shared/server';

import { SECRET_KEY_PURPOSE } from './app.secret';

const envSchema = z.object({
  // Process identity and runtime
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DEMO_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  PORT: z.coerce.number().int().positive(),

  // Required runtime infrastructure and security
  APP_SECRET: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url-encoded 32-byte random key'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LOKI_URL: z.url(),
  STORAGE_S3_BUCKET: z.string().min(1).optional(),
  STORAGE_S3_REGION: z.string().min(1).optional(),
  STORAGE_S3_ENDPOINT: z.url().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_S3_PUBLIC_URL_PREFIX: z.url().optional(),

  // Required machine integration
  ADMIN_API_URL: z.url(),
  PORTONE_API_SECRET: z.string().min(1).optional(),
  APP_BASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid service-api environment variables:', parsed.error.issues);
  throw new Error('Invalid service-api environment variables');
}

const { APP_SECRET: rootSecret, ...config } = parsed.data;

// APP_SECRET is the only configured root; each operation gets a purpose-specific key.
export const env = {
  ...config,
  USER_JWT_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.userJwtSigning),
  SESSION_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.sessionSigning),
  TWO_FACTOR_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.twoFactorEncryption),
  OAUTH_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.oauthClientSecretEncryption),
  NOTIFICATION_EMAIL_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.notificationEmailEncryption),
  NOTIFICATION_MESSENGER_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.notificationMessengerEncryption),
  NOTIFICATION_SMS_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.notificationSmsEncryption),
  NOTIFICATION_PUSH_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.notificationPushEncryption),
  PII_ENCRYPTION_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiEncryption),
  PII_HASH_KEY: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.piiSearchHmac),
  MACHINE_JWT_SECRET: deriveSecretKey(rootSecret, SECRET_KEY_PURPOSE.machineJwtSigning),
};
