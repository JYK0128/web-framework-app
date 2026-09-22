import { z } from '@pkg/shared/common';

const envSchema = z.object({
  // Process identity and runtime
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),

  // Required runtime infrastructure and security
  APP_SECRET: z.string().min(16),
  PII_ENCRYPTION_KEY: z.string().min(16),
  PII_HASH_KEY: z.string().min(16),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // Required machine integration
  INTERNAL_JWT_SECRET: z.string().min(16),
  INTERNAL_API_KEY: z.string().min(16).optional(),
  SERVICE_API_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid admin-api environment variables:', parsed.error.issues);
  throw new Error('Invalid admin-api environment variables');
}

export const env = parsed.data;
