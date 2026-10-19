import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import type { AuthPrincipal } from '#http/types/principal.type';

@Injectable()
export class PrincipalContext {
  constructor(private readonly cls: ClsService) {}

  get principal(): AuthPrincipal | null {
    if (!this.cls.isActive()) return null;
    return this.cls.get<AuthPrincipal>('principal') ?? null;
  }

  set(principal: AuthPrincipal): void {
    this.cls.set('principal', principal);
  }

  setUser(principal: Extract<AuthPrincipal, { type: 'user' }>): void {
    this.set(principal);
  }

  ensureUser(): Extract<AuthPrincipal, { type: 'user' }> {
    const principal = this.principal;
    if (!principal || principal.type !== 'user') {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return principal;
  }
}
