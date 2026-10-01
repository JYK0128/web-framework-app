import { z } from '@pkg/shared/common';
import { deriveSecretKey } from '@pkg/shared/server';

const envSchema = z.object({
  // Process identity and runtime
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),

  // Required runtime infrastructure and security
  APP_SECRET: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url-encoded 32-byte random key'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // Required machine integration
  ADMIN_API_URL: z.url(),
  PORTONE_API_SECRET: z.string().min(1).optional(),
  SERVICE_WEB_URL: z.url().optional(),
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
  APP_JWT_SECRET: deriveSecretKey(rootSecret, 'app/user-jwt-signing'),
  SESSION_SECRET: deriveSecretKey(rootSecret, 'app/session-signing'),
  APP_ENCRYPTION_KEY: deriveSecretKey(rootSecret, 'app/data-encryption'),
  PII_ENCRYPTION_KEY: deriveSecretKey(rootSecret, 'pii/encryption'),
  PII_HASH_KEY: deriveSecretKey(rootSecret, 'pii/search-hmac'),
  INTERNAL_JWT_SECRET: deriveSecretKey(rootSecret, 'app/internal-jwt'),
};
