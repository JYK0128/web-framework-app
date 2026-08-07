import { z } from '@pkg/shared/common';

const corsOriginSchema = z.union([z.literal('*'), z.url()]);
const booleanEnvSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  APP_NAME: z.string().min(1),
  APP_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_SECONDS: z.coerce.number().int().pipe(
    z.union([z.literal(-1), z.number().positive()]),
  ),
  SESSION_ROLLING_THRESHOLD_SECONDS: z.coerce.number().int().nonnegative().default(600),
  COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/),
  CSRF_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_.-]+$/).default('csrf_token'),
  COOKIE_SECURE: booleanEnvSchema,
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']),
  CORS_ORIGINS: z.string()
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(corsOriginSchema).min(1)),
  SEED_USER_EMAIL: z.email(),
  SEED_USER_PASSWORD: z.string().min(1),
  SEED_USER_NAME: z.string().trim().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  PASSWORD_MIN_LENGTH: z.coerce.number().int().positive().default(8),
  PASSWORD_EXPIRATION_DAYS: z.coerce.number().int().positive().default(90),
  PASSWORD_POLICY_REGEX: z.string().default('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  throw new Error('Invalid environment variables');
}

if (parsed.data.COOKIE_SAME_SITE === 'none' && !parsed.data.COOKIE_SECURE) {
  throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is none');
}

export const env = parsed.data;
export type Env = typeof env;
