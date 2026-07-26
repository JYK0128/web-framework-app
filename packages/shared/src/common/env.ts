import { z } from './zod';

const envSchema = z.object({
  I18N_COOKIE_NAME: z.string().default('lang'),
});

const getEnvObj = (): Record<string, string | undefined> => {
  const envMap: Record<string, string | undefined> = {};

  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const proc = (globalThis as Record<string, unknown>).process;
    if (proc && typeof proc === 'object' && 'env' in proc && proc.env && typeof proc.env === 'object') {
      Object.assign(envMap, proc.env);
    }
  }

  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    Object.assign(envMap, (import.meta as unknown as { env: Record<string, string> }).env);
  }

  return {
    ...envMap,
    I18N_COOKIE_NAME: envMap.I18N_COOKIE_NAME ?? envMap.VITE_I18N_COOKIE_NAME,
  };
};

const parsed = envSchema.safeParse(getEnvObj());

export const env = parsed.success ? parsed.data : envSchema.parse({});
