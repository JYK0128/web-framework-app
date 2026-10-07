import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { User } from '#/entities/auth/user.entity';
import { type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/infra/auth/user/user-auth.interface';

import { SessionService } from './session.service';

@Injectable()
export class SessionUserAuthService implements IUserAuthService {
  constructor(private readonly sessionService: SessionService) {}

  async login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    await this.establish(user, options);
    return {};
  }

  async refresh(_input: RefreshInput): Promise<TokenPairResult> {
    if (!this.sessionService.isAuthenticated()) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return {};
  }

  async logout(): Promise<void> {
    await this.sessionService.destroy();
  }

  private establish(user: User, options?: CreateTokenPairOptions): Promise<void> {
    return this.sessionService.establish({
      type: 'user',
      id: user.id,
      roles: user.role ? [user.role.code] : [],
      permissions: user.role?.permissions ?? [],
    }, { rememberMe: options?.rememberMe });
  }
}
