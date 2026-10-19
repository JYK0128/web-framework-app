import { z } from '@pkg/shared/common';

const parsedBrowserEnv = z.object({
  VITE_ADMIN_WEB_URL: z.url(),
  VITE_PORTONE_STORE_ID: z.string().trim().min(1),
  VITE_PORTONE_CHANNEL_KEY: z.string().trim().min(1),
}).parse(import.meta.env);

export const browserEnv = {
  adminWebUrl: parsedBrowserEnv.VITE_ADMIN_WEB_URL,
  portoneStoreId: parsedBrowserEnv.VITE_PORTONE_STORE_ID,
  portoneChannelKey: parsedBrowserEnv.VITE_PORTONE_CHANNEL_KEY,
};
