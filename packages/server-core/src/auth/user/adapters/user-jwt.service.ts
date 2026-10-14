import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { getCredentialPasswordExpiresAt } from '@pkg/server-core/auth/user/password.policy';
import { TokenStore } from '@pkg/server-core/auth/user/token/stores/token.store';
import { AUTH_READER, type AuthReader, type AuthUser, type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult, USER_AUTH_POLICY_OPTIONS, USER_JWT_OPTIONS, type UserAuthPolicyOptions, type UserJwtOptions } from '@pkg/server-core/auth/user/user-auth.interface';
import type { AuthPrincipal } from '@pkg/server-core/http/types/principal.type';
import { ApplicationError, TimeUtil, uuid, z } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify, SignJWT } from 'jose';

const tokenClaimsSchema = z.object({
  sub: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  phoneNumberVerified: z.boolean(),
  twoFactorSetupRequired: z.boolean(),
  passwordExpiresAt: z.number().nullable(),
  rememberMe: z.boolean(),
});
type TokenClaims = z.infer<typeof tokenClaimsSchema>;

@Injectable()
export class UserJwtService implements IUserAuthService {
  constructor(
    @Inject(AUTH_READER) private readonly reader: AuthReader,
    private readonly tokenStore: TokenStore,
    @Inject(USER_JWT_OPTIONS) private readonly jwt: UserJwtOptions,
    @Inject(USER_AUTH_POLICY_OPTIONS) private readonly policy: UserAuthPolicyOptions,
  ) {}

  async authenticate(request: Request): Promise<Extract<AuthPrincipal, { type: 'user' }>> {
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw authenticationRequired();
    let claims: TokenClaims;
    try {
      claims = await this.verifyAccessToken(token);
    }
    catch {
      throw authenticationRequired();
    }
    return {
      type: 'user',
      id: claims.sub,
      roles: claims.roles,
      permissions: claims.permissions,
      phoneNumberVerified: claims.phoneNumberVerified,
      twoFactorSetupRequired: claims.twoFactorSetupRequired,
      passwordExpiresAt: claims.passwordExpiresAt,
    };
  }

  async login(user: AuthUser, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (this.jwt.revokeOnLogin && !options?.familyId) await this.tokenStore.revokeUserTokens(user.id);
    return this.issue(user, options);
  }

  async refresh(input: RefreshInput): Promise<TokenPairResult> {
    if (!input.refreshToken) throw authenticationRequired();
    const consumed = await this.tokenStore.consumeToken(input.refreshToken);
    if ('reason' in consumed) throw authenticationRequired();
    const token = consumed.record;
    const user = await this.reader.findUserById(token.sub);
    if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) {
      await this.tokenStore.revokeTokenFamily(token.familyId);
      throw authenticationRequired();
    }
    return this.issue(user, { rememberMe: token.rememberMe, familyId: token.familyId });
  }

  private async issue(user: AuthUser, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const refreshToken = `rt_${uuid()}`;
    const rememberMe = options?.rememberMe === true;
    const familyId = options?.familyId ?? uuid();
    const { familyTtlSeconds, retentionTtlSeconds } = this.getTokenTtls(rememberMe);
    await this.tokenStore.storeToken(refreshToken, { sub: user.id, rememberMe, familyId, roleId: user.role.id, expiresAt: Date.now() + TimeUtil.ms.second(retentionTtlSeconds) }, retentionTtlSeconds, familyTtlSeconds);
    return { accessToken: await this.issueAccessToken(user, rememberMe), refreshToken, refreshTokenTtlSeconds: retentionTtlSeconds };
  }

  private async issueAccessToken(user: AuthUser, rememberMe: boolean): Promise<string> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const account = this.policy.passwordExpirationDays > 0 ? await this.reader.findCredentialAccount(user.id) : null;
    const payload: Omit<TokenClaims, 'sub'> & { jti: string } = {
      jti: uuid(),
      roles: [user.role.code],
      permissions: user.role.permissions,
      phoneNumberVerified: user.phoneNumberVerified,
      twoFactorSetupRequired: this.policy.twoFactorRequired && !user.twoFactorEnabled,
      passwordExpiresAt: account?.password ? getCredentialPasswordExpiresAt(account, { expirationDays: this.policy.passwordExpirationDays, changeDeferDays: this.policy.passwordChangeDeferDays }) : null,
      rememberMe,
    };
    return new SignJWT(payload).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(this.jwt.issuer).setAudience(this.jwt.audience).setSubject(user.id).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(this.jwt.accessTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(this.jwt.secret));
  }

  private async verifyAccessToken(token: string): Promise<TokenClaims> {
    const result = await jwtVerify(token, new TextEncoder().encode(this.jwt.secret), { issuer: this.jwt.issuer, audience: this.jwt.audience, algorithms: ['HS256'] });
    return tokenClaimsSchema.parse(result.payload);
  }

  private getTokenTtls(rememberMe: boolean): { familyTtlSeconds: number, retentionTtlSeconds: number } {
    const familyTtlSeconds = rememberMe ? TimeUtil.s.day(this.jwt.rememberMeDays) : TimeUtil.s.minute(this.jwt.refreshIdleTimeoutMinutes);
    return { familyTtlSeconds, retentionTtlSeconds: familyTtlSeconds + TimeUtil.s.minute(this.jwt.accessTokenTtlMinutes) + 60 };
  }

  async logout(refreshToken?: string): Promise<void> { if (refreshToken) await this.tokenStore.revokeToken(refreshToken); }
  async revokeUserTokens(userId: string): Promise<void> { await this.tokenStore.revokeUserTokens(userId); }
  async invalidateRoleTokens(roleId: string): Promise<void> {
    await this.tokenStore.revokeRoleTokens(roleId);
  }
}

function authenticationRequired(): ApplicationError {
  return new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
}
