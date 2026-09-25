import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { AUTH_MODE_KEY, type AuthMode } from '#/common/decorators/auth-mode.decorator';
import { MAINTENANCE_EXEMPT_KEY } from '#/common/decorators/maintenance-exempt.decorator';

import { MaintenanceService } from './maintenance.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const authMode = this.reflector.getAllAndOverride<AuthMode>(AUTH_MODE_KEY, targets);
    const exempt = this.reflector.getAllAndOverride<boolean>(MAINTENANCE_EXEMPT_KEY, targets);
    if (authMode === 'machine' || exempt || !authMode) return true;

    const status = await this.maintenanceService.getStatus();
    if (status.active) {
      throw new ApplicationError({
        code: 'SERVICE_UNDER_MAINTENANCE',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: status.message,
      });
    }
    return true;
  }
}
