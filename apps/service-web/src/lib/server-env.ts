import { z } from '@pkg/shared/common';

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  API_BASE_URL: z.url(),
  APP_BASE_URL: z.url(),
  APP_NAME: z.literal('service'),
  SESSION_SECRET: z.string().min(32),
});
