export const TOKEN_STORE = Symbol('TOKEN_STORE');

export interface RefreshToken {
  sub: string
  rememberMe: boolean
  familyId: string
  expiresAt: number
}

export type TokenConsumeResult
  = | { record: RefreshToken }
    | { reason: 'reused' | 'not-found' };

export interface TokenStore {
  storeToken(token: string, record: RefreshToken, retentionTtlSeconds: number, familyTtlSeconds: number): Promise<void>
  consumeToken(token: string): Promise<TokenConsumeResult>
  revokeToken(token: string): Promise<void>
  revokeTokenFamily(familyId: string): Promise<void>
  listUserTokens(userId: string): Promise<RefreshToken[]>
  revokeUserTokens(userId: string): Promise<void>
}
