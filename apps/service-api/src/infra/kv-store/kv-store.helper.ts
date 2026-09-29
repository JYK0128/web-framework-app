import { SERVICE_ID } from '#/app.config';

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
    refreshToken: (hash: string) => `${SERVICE_ID}:auth_token:refresh:${hash}`,
    refreshTokenUsed: (hash: string) => `${SERVICE_ID}:auth_token:refresh_used:${hash}`,
    refreshFamily: (familyId: string) => `${SERVICE_ID}:auth_token:refresh_family:${familyId}`,
    userFamilies: (userId: string) => `${SERVICE_ID}:auth_token:user_families:${userId}`,
    session: (id: string) => `${SERVICE_ID}:auth_session:${id}`,
    oauthState: (hash: string) => `${SERVICE_ID}:auth_oauth_state:${hash}`,
  },
} as const;
