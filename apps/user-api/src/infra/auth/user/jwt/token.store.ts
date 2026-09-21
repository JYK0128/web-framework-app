import type { RefreshTokenRecord } from '#/infra/kv-store/kv-store.helper';

export const TOKEN_STORE = Symbol('TOKEN_STORE');

export type TokenConsumeResult
  = | { status: 'success', record: RefreshTokenRecord }
    | { status: 'fail', reason: 'reused' | 'not-found' };

export interface TokenStore {
  storeToken(token: string, record: RefreshTokenRecord, ttlSeconds: number): Promise<void>
  consumeToken(token: string): Promise<TokenConsumeResult>
  revokeToken(token: string): Promise<void>
  revokeTokenFamily(familyId: string): Promise<void>
}
