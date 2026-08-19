import { Injectable } from '@nestjs/common';
import { z } from '@pkg/shared/common';
import { randomBase64Url } from '@pkg/shared/server';
import { jwtVerify, SignJWT } from 'jose';

import { RoleName } from '#/entities/auth.extentions/role.entity';
import { env } from '#/env';

import { type AuthPrincipal, type AuthTokenClaims, type AuthTokenType, type IssuedAuthToken } from './auth-token.types';

const authTokenPayloadSchema = z.object({
  iss: z.string(),
  aud: z.union([z.string(), z.array(z.string())]),
  sub: z.string(),
  jti: z.string(),
  iat: z.number(),
  exp: z.number(),
  tokenType: z.enum(['access', 'refresh']),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  passwordChangedAt: z.number().nullable(),
  role: z.union([
    z.literal(RoleName.USER),
    z.literal(RoleName.ADMIN),
  ]).nullable(),
  tokenFamilyId: z.string(),
}).strict();

@Injectable()
export class AuthTokenCodec {
  private readonly secret = new TextEncoder().encode(env.APP_SECRET);

  async issue(
    tokenType: AuthTokenType,
    principal: AuthPrincipal,
    ttlSeconds: number,
    tokenFamilyId: string,
  ): Promise<IssuedAuthToken> {
    const jti = randomBase64Url();
    const token = await new SignJWT({
      tokenType,
      name: principal.name,
      email: principal.email,
      emailVerified: principal.emailVerified,
      passwordChangedAt: principal.passwordChangedAt,
      role: principal.role,
      tokenFamilyId,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(env.APP_NAME)
      .setAudience('react-starter-kit')
      .setSubject(principal.id)
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(String(ttlSeconds) + 's')
      .sign(this.secret);

    return { token, jti };
  }

  async verify(token: string, tokenType: AuthTokenType): Promise<AuthTokenClaims> {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: ['HS256'],
      issuer: env.APP_NAME,
      audience: 'react-starter-kit',
    });

    const parsedPayload = authTokenPayloadSchema.safeParse(payload);
    if (!parsedPayload.success || parsedPayload.data.tokenType !== tokenType) {
      throw new Error('Invalid token');
    }

    const claims = parsedPayload.data;

    return {
      jti: claims.jti,
      userId: claims.sub,
      name: claims.name,
      email: claims.email,
      emailVerified: claims.emailVerified,
      passwordChangedAt: claims.passwordChangedAt,
      role: claims.role,
      tokenFamilyId: claims.tokenFamilyId,
      issuedAt: claims.iat,
      expiresAt: claims.exp,
    };
  }
}
