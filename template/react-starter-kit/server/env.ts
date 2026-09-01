import { z } from '@pkg/shared/common';

const serverEnvSchema = z.object({
  BACKEND_URL: z.url(),
});

export function getEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid server environment variables:', parsed.error.issues);
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

export type ServerEnv = ReturnType<typeof getEnv>;
