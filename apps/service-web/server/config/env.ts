import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  AUTH_URL: z.url(),
  SERVICE_API_URL: z.url(),
  REDIS_URL: z.string().min(1),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive(),
  SESSION_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid service-web server environment variables:', parsed.error.issues);
  throw new Error('Invalid service-web server environment variables');
}

export const env = parsed.data;
export type ServerEnv = typeof env;
