import { z } from '@pkg/shared/common';

const envSchema = z.object({
  // 1. Application & Core Secrets
  APP_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
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

  // Firebase Admin SDK (Service Account Credentials)
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // Nodemailer / SMTP
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  // Slack Incoming Webhook
  SLACK_WEBHOOK_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = typeof env;
