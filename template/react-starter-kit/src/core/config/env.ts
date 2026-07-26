import { z } from '@pkg/shared/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number(),
  API_SPEC_URL: z.url(),
  API_BASE_URL: z.url(),
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
    API_SPEC_URL: envMap.API_SPEC_URL ?? envMap.OPENAPI_URL,
    API_BASE_URL: envMap.API_BASE_URL ?? envMap.VITE_API_BASE_URL,
    I18N_COOKIE_NAME: envMap.I18N_COOKIE_NAME ?? envMap.VITE_I18N_COOKIE_NAME,
  };
};

const envObj = getEnvObj();

const parsed = envSchema.safeParse({
  NODE_ENV: envObj.NODE_ENV,
  PORT: envObj.PORT,
  API_SPEC_URL: envObj.API_SPEC_URL,
  API_BASE_URL: envObj.API_BASE_URL,
  I18N_COOKIE_NAME: envObj.I18N_COOKIE_NAME,
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.issues);
  throw new Error(`Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
