import { z } from '@pkg/shared/common';

const serverEnvSchema = z.object({
  I18N_COOKIE_NAME: z.string().trim().min(1),
});

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
};

export const serverEnv = serverEnvSchema.parse({
  I18N_COOKIE_NAME: runtime.process?.env?.I18N_COOKIE_NAME,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
