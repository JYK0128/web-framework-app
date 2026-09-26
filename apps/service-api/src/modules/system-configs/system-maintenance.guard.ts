import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { SystemContext } from './system.context';
import { getMaintenanceMessage } from './system-config-time';

const MAINTENANCE_EXEMPT_PATHS = ['/health', '/api/v1/health', '/api/v1/system-configs', '/api/v1/internal/system-configs'];

@Injectable()
export class SystemMaintenanceGuard implements CanActivate {
  constructor(private readonly systemContext: SystemContext) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || request.url || '';
    if (MAINTENANCE_EXEMPT_PATHS.some((prefix) => path.startsWith(prefix))) return true;

    const { maintenance } = await this.systemContext.getConfig();
    const message = getMaintenanceMessage(maintenance, new Date());
    if (message === undefined) return true;
    throw new ApplicationError({
      code: 'SERVICE_MAINTENANCE',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      params: { message },
    });
  }
}
