import { z } from '@pkg/shared/common';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  API_BASE_URL: z.url(),
  APP_BASE_URL: z.url(),
  APP_NAME: z.literal('admin'),
  SESSION_SECRET: z.string().min(32),
});

export const getServerEnv = () => serverEnvSchema.parse(process.env);
