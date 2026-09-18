import { z } from '@pkg/shared/common';

const envSchema = z.object({
  APP_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  APP_SECRET: z.string().min(16),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  INTERNAL_JWT_SECRET: z.string().min(16),
  SUPER_USER_INIT_EMAIL: z.string().min(1),
  SUPER_USER_INIT_PASSWORD: z.string().min(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid service-api environment variables:', parsed.error.issues);
  throw new Error('Invalid service-api environment variables');
}

export const env = parsed.data;
export type Env = typeof env;
