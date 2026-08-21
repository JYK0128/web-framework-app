import { z } from '@pkg/shared/common';
import { createServerOnlyFn } from '@tanstack/react-start';

const envSchema = z.object({
  // 1. Application & Server
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.coerce.number().int().positive().optional().default(3000),

  // 2. Service Endpoints
  BACKEND_URL: z.url().optional(),
  FRONTEND_URL: z.url().optional(),
  API_SPEC_URL: z.url().optional(),

  // 3. Analytics
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

export const getEnv = createServerOnlyFn(() => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid frontend environment variables:', parsed.error.issues);
    throw new Error('Invalid frontend environment variables');
  }

  return parsed.data;
});

export type Env = ReturnType<typeof getEnv>;
