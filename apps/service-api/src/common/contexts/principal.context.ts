import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import type { AuthenticatedPrincipal, UserPrincipal } from '#/common/auth/principal';

@Injectable()
export class PrincipalContext {
  constructor(private readonly cls: ClsService) {}

  get principal(): AuthenticatedPrincipal | null {
    if (!this.cls.isActive()) return null;
    return this.cls.get<AuthenticatedPrincipal>('principal') ?? null;
  }

  set(principal: AuthenticatedPrincipal): void {
    this.cls.set('principal', principal);
  }

  setUser(principal: Omit<UserPrincipal, 'type'>): void {
    this.set({ type: 'user', ...principal });
  }

  ensureUser(): UserPrincipal {
    const principal = this.principal;
    if (!principal || principal.type !== 'user') {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return principal;
  }
}
