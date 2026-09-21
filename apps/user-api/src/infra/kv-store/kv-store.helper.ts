export interface RefreshTokenRecord {
  sub: string
  rememberMe: boolean
  familyId: string
  expiresAt: number
}

export interface AuthKvRecords {
  refreshToken: RefreshTokenRecord
  refreshFamily: string
  refreshTokenUsed: string
}

export const KvStoreKey = {
  auth: {
    refreshToken: (hash: string) => `user:auth_token:refresh:${hash}`,
    refreshTokenUsed: (hash: string) => `user:auth_token:refresh_used:${hash}`,
    refreshFamily: (familyId: string) => `user:auth_token:refresh_family:${familyId}`,
    session: (id: string) => `user:auth_session:${id}`,
  },
} as const;
