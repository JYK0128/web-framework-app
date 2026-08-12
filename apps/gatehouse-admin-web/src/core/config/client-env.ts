import { z } from '@pkg/shared/common';

const clientEnvSchema = z.object({
  API_BASE_URL: z.url(),
});

const viteEnv = import.meta.env as unknown as Record<string, string | undefined>;

export const clientEnv = clientEnvSchema.parse({
  API_BASE_URL: viteEnv.VITE_API_BASE_URL ?? 'http://localhost:3200',
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
