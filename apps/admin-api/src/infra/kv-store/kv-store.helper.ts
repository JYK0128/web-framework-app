export const KvStoreKey = {
  auth: {
    token: (token: string) => `admin:auth_token:${token}`,
  },
} as const;
