import type { RefreshTokenRecord } from '#/infra/kv-store/kv-store.helper';

export const TOKEN_STORE = Symbol('TOKEN_STORE');

export type TokenConsumeResult
  = | { status: 'success', record: RefreshTokenRecord }
    | { status: 'fail', reason: 'reused' | 'not-found' };

export interface TokenStore {
  storeToken(token: string, record: RefreshTokenRecord, retentionTtlSeconds: number, sessionTtlSeconds: number): Promise<void>
  consumeToken(token: string): Promise<TokenConsumeResult>
  touchFamily(familyId: string, sessionTtlSeconds: number): Promise<boolean>
  revokeToken(token: string): Promise<void>
  revokeTokenFamily(familyId: string): Promise<void>
  listUserTokens(userId: string): Promise<RefreshTokenRecord[]>
  revokeUserTokens(userId: string): Promise<void>
}
