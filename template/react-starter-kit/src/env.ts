import { z } from '@pkg/shared/common';
import { createServerOnlyFn } from '@tanstack/react-start';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  BACKEND_URL: z.url().optional(),
  FRONTEND_URL: z.url().optional(),
  REDIS_URL: z.string().min(1).optional(),
});

export const getEnv = createServerOnlyFn(() => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.issues);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
});

export type Env = ReturnType<typeof getEnv>;
