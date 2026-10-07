import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, getMaintenanceMessage } from '@pkg/shared/common';
import type { Request } from 'express';

import { SystemContext } from './system.context';

const MAINTENANCE_EXEMPT_PATHS = [
  '/health/live',
  '/health/ready',
  '/api/v1/health/live',
  '/api/v1/health/ready',
  '/api/v1/service-configs',
  '/api/v1/internal/system-configs',
];

@Injectable()
export class SystemMaintenanceGuard implements CanActivate {
  constructor(private readonly systemContext: SystemContext) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || request.url || '';
    if (MAINTENANCE_EXEMPT_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;

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
