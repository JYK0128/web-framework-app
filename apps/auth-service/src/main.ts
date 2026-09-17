import 'reflect-metadata';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { EntityManager } from '@mikro-orm/core';
import { Body, Controller, Get, HttpCode, Module, Post, Req, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request } from 'express';

import { DatabaseModule } from './database/database.module.js';
import { AuthSession, AuthUser } from './database/entities.js';

const secret = process.env.APP_SECRET ?? 'development-only-change-me';
type Claims = {
  sub: string
  aud: string[]
  scope: string[]
  type: 'access' | 'refresh'
  exp: number
};
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = <T>(value: string) =>
  JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
const signature = (value: string) =>
  createHmac('sha256', secret).update(value).digest('base64url');
function sign(claims: Claims): string {
  const h = encode({ alg: 'HS256', typ: 'JWT' });
  const p = encode(claims);
  return `${h}.${p}.${signature(`${h}.${p}`)}`;
}
function verify(token: string, type: Claims['type']): Claims | null {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = signature(`${h}.${p}`);
    if (!timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const claims = decode<Claims>(p);
    return claims.type === type && claims.exp > Date.now() / 1000
      ? claims
      : null;
  }
  catch {
    return null;
  }
}
function issue(userId: string, type: Claims['type'], ttl: number): string {
  return sign({
    sub: userId,
    aud: ['admin-api', 'service-api'],
    scope: ['skeleton:read'],
    type,
    exp: Math.floor(Date.now() / 1000) + ttl,
  });
}

@Controller()
class AuthController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get('health') health() {
    return { status: 'ok', service: 'auth-service' };
  }

  @Post('auth/login') async login(@Body() body: { userId?: string }) {
    const userId = body?.userId || 'demo-user';
    const accessToken = issue(userId, 'access', 900);
    const refreshToken = issue(userId, 'refresh', 2_592_000);
    let user = await this.entityManager.findOne(AuthUser, { id: userId });
    if (!user) {
      user = this.entityManager.create(AuthUser, {
        id: userId,
        name: userId,
        email: `${userId}@example.invalid`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.entityManager.persist(user);
      await this.entityManager.flush();
    }
    const session = this.entityManager.create(AuthSession, {
      id: randomUUID(),
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 2_592_000 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.entityManager.persist(session);
    await this.entityManager.flush();
    return { accessToken, refreshToken, expiresIn: 900, user: { id: user.id } };
  }

  @Post('auth/refresh') async refresh(@Body() body: { refreshToken?: string }) {
    const token = body?.refreshToken ?? '';
    const session = await this.entityManager.findOne(AuthSession, { token });
    const claims
      = session && session.expiresAt > new Date()
        ? verify(token, 'refresh')
        : null;
    if (!claims)
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    return { accessToken: issue(claims.sub, 'access', 900), expiresIn: 900 };
  }

  @Post('auth/logout') @HttpCode(204) async logout(
    @Body() body: { refreshToken?: string },
  ) {
    if (body?.refreshToken) {
      const session = await this.entityManager.findOne(AuthSession, {
        token: body.refreshToken,
      });
      if (session) {
        this.entityManager.remove(session);
        await this.entityManager.flush();
      }
    }
  }

  @Get('me') me(@Req() req: Request) {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const claims = verify(token, 'access');
    if (!claims)
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    return {
      userId: claims.sub,
      requestId: req.header('x-request-id') ?? null,
    };
  }
}
@Module({ imports: [DatabaseModule], controllers: [AuthController] })
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(Number(process.env.PORT ?? 4100));
  console.log(
    `auth-service listening on :${process.env.PORT ?? 4100} (${randomUUID()})`,
  );
}

void bootstrap();
