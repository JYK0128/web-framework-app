import 'reflect-metadata';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, UnauthorizedException, UseGuards } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request } from 'express';

const secret = process.env.APP_SECRET ?? 'development-only-change-me';
type Claims = { sub: string, aud: string[], scope: string[], exp: number };
function claimsFrom(req: Request): Claims | null {
  try {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = createHmac('sha256', secret)
      .update(`${h}.${p}`)
      .digest('base64url');
    if (!timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const claims = JSON.parse(
      Buffer.from(p, 'base64url').toString('utf8'),
    ) as Claims;
    return claims.exp > Date.now() / 1000 && claims.aud.includes('service-api')
      ? claims
      : null;
  }
  catch {
    return null;
  }
}
@Injectable()
class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const claims = claimsFrom(context.switchToHttp().getRequest<Request>());
    if (!claims)
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    return true;
  }
}
@Controller()
class ServiceController {
  @Get('health') health() {
    return { status: 'ok', service: 'service-api' };
  }

  @UseGuards(JwtGuard) @Get('me') me(req: Request) {
    const claims = claimsFrom(req);
    return {
      userId: claims?.sub,
      plane: 'service',
      requestId: req.header('x-request-id') ?? null,
    };
  }
}
@Module({ controllers: [ServiceController], providers: [JwtGuard] })
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(Number(process.env.PORT ?? 4300));
  console.log(`service-api listening on :${process.env.PORT ?? 4300}`);
}

void bootstrap();
