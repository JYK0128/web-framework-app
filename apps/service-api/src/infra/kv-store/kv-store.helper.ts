export const KvStoreKey = {
  auth: {
    token: (token: string) => `service:auth_token:${token}`,
  },
} as const;
