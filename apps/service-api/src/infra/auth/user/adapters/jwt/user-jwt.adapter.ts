import { Injectable } from '@nestjs/common';
import { TimeUtil } from '@pkg/shared/common';
import { jwtVerify, SignJWT } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { env } from '#/env';
import { type UserTokenClaims, UserTokenClaimsSchema } from '#/infra/auth/user/adapters/jwt/user-token-claims';

type AccessTokenClaims = Pick<UserTokenClaims, 'jti' | 'roles' | 'permissions' | 'sid' | 'rememberMe'>;

@Injectable()
export class UserJwtAdapter {
  async sign(userId: string, claims: AccessTokenClaims): Promise<string> {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID).setAudience(SERVICE_ID).setSubject(userId).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(SECURITY_CONFIG.token.accessTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(env.USER_JWT_SECRET));
  }

  async verify(token: string): Promise<UserTokenClaims> {
    const result = await jwtVerify(token, new TextEncoder().encode(env.USER_JWT_SECRET), {
      issuer: SERVICE_ID, audience: SERVICE_ID, algorithms: ['HS256'],
    });
    return UserTokenClaimsSchema.parse(result.payload);
  }
}
