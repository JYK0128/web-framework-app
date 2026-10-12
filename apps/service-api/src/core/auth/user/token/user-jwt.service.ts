import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid, z } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { getCredentialPasswordExpiresAt } from '#/core/auth/user/policy/password.policy';
import { TOKEN_STORE, type TokenStore } from '#/core/auth/user/token/stores/token.store';
import { type AuthenticatedUser, type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/core/auth/user/user-auth.interface';
import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';

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
    private readonly em: AppEntityManager,
    @Inject(TOKEN_STORE) private readonly refreshTokenStore: TokenStore,
  ) {}

  async authenticate(request: Request): Promise<AuthenticatedUser> {
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    let payload: TokenClaims;
    try {
      payload = await this.verifyAccessToken(token);
    }
    catch {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return {
      user: {
        id: payload.sub,
        phoneNumberVerified: payload.phoneNumberVerified,
        twoFactorSetupRequired: payload.twoFactorSetupRequired,
      },
      passwordExpiresAt: payload.passwordExpiresAt,
      principal: { id: payload.sub, roles: payload.roles, permissions: payload.permissions },
    };
  }

  async login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (SECURITY_CONFIG.token.revokeOnLogin && !options?.familyId) {
      await this.refreshTokenStore.revokeUserTokens(user.id);
      await this.em.flush();
    }
    return this.issue(user, options);
  }

  async refresh(input: RefreshInput): Promise<TokenPairResult> {
    const refreshToken = input.refreshToken;
    if (!refreshToken) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const consumed = await this.refreshTokenStore.consumeToken(refreshToken);
    if ('reason' in consumed) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokenData = consumed.record;
    const user = await this.em.findOne(User, { id: tokenData.sub }, { populate: ['role'] });
    if (!user || user.isDeleted || user.isBanned || user.isLocked) {
      await this.refreshTokenStore.revokeTokenFamily(tokenData.familyId);
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return this.issue(user, { rememberMe: tokenData.rememberMe === true, familyId: tokenData.familyId });
  }

  private async issue(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const refreshToken = `rt_${uuid()}`;
    const rememberMe = options?.rememberMe === true;
    const familyId = options?.familyId ?? uuid();
    const { familyTtlSeconds, refreshTokenRetentionSeconds } = this.getTokenTtls(rememberMe);
    await this.refreshTokenStore.storeToken(refreshToken, {
      sub: user.id,
      rememberMe,
      familyId,
      expiresAt: Date.now() + TimeUtil.ms.second(refreshTokenRetentionSeconds),
    }, refreshTokenRetentionSeconds, familyTtlSeconds);
    return { accessToken: await this.issueAccessToken(user, rememberMe), refreshToken, refreshTokenTtlSeconds: refreshTokenRetentionSeconds };
  }

  private async issueAccessToken(user: User, rememberMe: boolean): Promise<string> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const account = SECURITY_CONFIG.password.expirationDays > 0
      ? await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL })
      : null;
    const tokenClaims: Omit<TokenClaims, 'sub'> & { jti: string } = {
      jti: uuid(),
      roles: [user.role.code],
      permissions: user.role.permissions ?? [],
      phoneNumberVerified: user.phoneNumberVerified,
      twoFactorSetupRequired: SECURITY_CONFIG.twoFactor.required && !user.twoFactorEnabled,
      passwordExpiresAt: account?.password ? getCredentialPasswordExpiresAt(account) : null,
      rememberMe,
    };
    return new SignJWT(tokenClaims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID).setAudience(SERVICE_ID).setSubject(user.id).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(SECURITY_CONFIG.token.accessTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(env.USER_JWT_SECRET));
  }

  private async verifyAccessToken(token: string): Promise<TokenClaims> {
    const result = await jwtVerify(token, new TextEncoder().encode(env.USER_JWT_SECRET), {
      issuer: SERVICE_ID, audience: SERVICE_ID, algorithms: ['HS256'],
    });
    return tokenClaimsSchema.parse(result.payload);
  }

  private getTokenTtls(rememberMe: boolean): { familyTtlSeconds: number, refreshTokenRetentionSeconds: number } {
    const familyTtlSeconds = rememberMe
      ? TimeUtil.s.day(SECURITY_CONFIG.token.rememberMeDays)
      : TimeUtil.s.minute(SECURITY_CONFIG.token.refreshIdleTimeoutMinutes);
    const accessTokenTtlSeconds = TimeUtil.s.minute(SECURITY_CONFIG.token.accessTokenTtlMinutes);
    return {
      familyTtlSeconds,
      refreshTokenRetentionSeconds: familyTtlSeconds + accessTokenTtlSeconds + 60,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.refreshTokenStore.revokeToken(refreshToken);
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.refreshTokenStore.revokeUserTokens(userId);
  }

  async revokeRoleUsersTokens(roleId: string): Promise<void> {
    const users = await this.em.find(User, { role: roleId }, { filters: false });
    await Promise.all(users.map(({ id }) => this.refreshTokenStore.revokeUserTokens(id)));
  }
}
