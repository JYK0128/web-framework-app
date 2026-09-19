import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, type AuthenticatedPrincipal, type UserPrincipal } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrincipalContext {
  constructor(private readonly cls: ClsService) {}

  get principal(): AuthenticatedPrincipal | null {
    if (!this.cls.isActive()) return null;
    return this.cls.get<AuthenticatedPrincipal>('principal') ?? null;
  }

  ensureUser(): UserPrincipal {
    const principal = this.principal;
    if (!principal || principal.type !== 'user') {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return principal;
  }
}
