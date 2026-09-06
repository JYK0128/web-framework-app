import { z } from '@pkg/shared/common';

const envSchema = z.object({
  // 1. Application & Core Secrets
  APP_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  PORT: z.coerce.number().int().positive().optional(),
  APP_SECRET: z.string().min(32),

  // 2. Databases & Caching
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // 3. Service URLs & Telemetry
  FRONTEND_URL: z.url(),
  LOKI_URL: z.url(),

  // 4. OAuth & External Services
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // PortOne Identity Verification
  PORTONE_API_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  throw new Error('Invalid environment variables');
}

export const env = {
  ...parsed.data,
  PORT: parsed.data.PORT ?? parsed.data.BACKEND_PORT,
};
export type Env = typeof env;
