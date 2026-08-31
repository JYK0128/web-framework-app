import { z } from '@pkg/shared/common';

const envSchema = z.object({
  // 1. Analytics
  VITE_GA_MEASUREMENT_ID: z.string().regex(/^G-[A-Z0-9]+$/),

  // 2. Firebase Web SDK
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),

  // 3. PortOne Identity Verification
  VITE_PORTONE_STORE_ID: z.string().min(1),
  VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Invalid public environment variables:', parsed.error.issues);
  throw new Error('Invalid public environment variables');
}

export const env = parsed.data;

export type Env = typeof env;
