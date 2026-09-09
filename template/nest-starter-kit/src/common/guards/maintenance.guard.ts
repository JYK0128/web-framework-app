import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { MAINTENANCE_EXEMPT_PATH_PREFIXES } from '#/common/configs/application.config';
import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly systemContext: SystemContext,
    private readonly sessionContext: SessionContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const maintenance = await this.systemContext.isMaintenanceActive();
    if (!maintenance.isActive) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path || req.url || '';

    // 1. 점검 중에도 필수 접근 가능한 경로 허용 (헬스체크, 공개 설정, 관리자 로그인 등)
    const isExempt = MAINTENANCE_EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (isExempt) {
      return true;
    }

    // 2. 시스템 관리 권한('system:manage')을 보유한 관리자는 점검 중에도 전체 접근 허용
    const user = this.sessionContext.user;
    if (user?.permissions && user.permissions['system:manage']) {
      return true;
    }

    // 3. 그 외 일반 사용자 요청은 503 Service Unavailable 차단
    throw new ApplicationError({
      code: 'SERVICE_MAINTENANCE',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      params: { message: maintenance.message },
    });
  }
}
