import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { JWTPayload } from 'jose';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UserContext {
  constructor(private readonly cls: ClsService) {}

  get user(): JWTPayload | null {
    if (!this.cls.isActive()) return null;
    return this.cls.get<JWTPayload>('user') ?? null;
  }

  ensureUser(): Required<JWTPayload> {
    const user = this.user;
    if (!user || !user.sub) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }
    return user as Required<JWTPayload>;
  }
}
