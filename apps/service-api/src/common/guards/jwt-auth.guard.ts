import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';
import { ClsService } from 'nestjs-cls';

import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { TokenStoreService } from '#/common/services/token-store.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly jwtService: JwtService,
    private readonly tokenStoreService: TokenStoreService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.header('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    let payload: JWTPayload;
    try {
      payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        audience: 'admin-api',
        algorithms: ['HS256'],
      });
    }
    catch {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    // 하이브리드: JWT 유효 + AuthToken 유효 모두 확인
    if (payload.jti) {
      const tokenData = await this.tokenStoreService.get(payload.jti);
      if (!tokenData) {
        throw new ApplicationError({
          code: 'AUTHENTICATION_REQUIRED',
          status: HttpStatus.UNAUTHORIZED,
        });
      }
      await this.tokenStoreService.touch(payload.jti);
    }

    this.cls.set('user', payload);
    return true;
  }
}
