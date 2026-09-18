export const KvStoreKey = {
  auth: {
    token: (token: string) => `auth_token:${token}`,
  },
} as const;
