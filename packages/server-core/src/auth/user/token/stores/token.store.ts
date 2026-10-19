export interface RefreshToken { sub: string, rememberMe: boolean, familyId: string, expiresAt: number, roleId?: string }
export type TokenConsumeResult = { record: RefreshToken } | { reason: 'reused' | 'not-found' };

export abstract class TokenStore {
  abstract storeToken(token: string, record: RefreshToken, retentionTtlSeconds: number, familyTtlSeconds: number): Promise<void>;
  abstract consumeToken(token: string): Promise<TokenConsumeResult>;
  abstract revokeToken(token: string): Promise<void>;
  abstract revokeTokenFamily(familyId: string): Promise<void>;
  abstract listUserTokens(userId: string): Promise<RefreshToken[]>;
  abstract revokeUserTokens(userId: string): Promise<void>;
  abstract revokeRoleTokens(roleId: string): Promise<void>;
}
