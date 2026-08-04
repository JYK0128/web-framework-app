import { z } from 'zod';

const corsOriginSchema = z.union([z.literal('*'), z.url()]);
const booleanEnvSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  DATABASE_PATH: z.string().min(1),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive(),
  SESSION_SECRET: z.string().min(32),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(31),
  COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/),
  COOKIE_SECURE: booleanEnvSchema,
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']),
  CORS_ORIGINS: z.string()
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(corsOriginSchema).min(1)),
  SEED_USER_EMAIL: z.email(),
  SEED_USER_PASSWORD: z.string().min(12),
  SEED_USER_NAME: z.string().trim().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
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
