import { z } from '@pkg/shared/common';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  ADMIN_API_URL: z.url(),
  CSRF_SECRET: z.string().min(16),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid admin-web server environment variables:', parsed.error.issues);
  throw new Error('Invalid admin-web server environment variables');
}

export const env = parsed.data;
export type ServerEnv = typeof env;
