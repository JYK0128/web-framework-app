import { z } from '@pkg/shared/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  BACKEND_URL: z.url(),
  FRONTEND_URL: z.url(),
});

export const getEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.issues);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

export type Env = ReturnType<typeof getEnv>;
