import { z } from '@pkg/shared/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  APP_NAME: z.string().min(1),
  APP_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL: z.url(),
  LOKI_URL: z.url(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('noreply@example.com'),
  SLACK_WEBHOOK_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = typeof env;
