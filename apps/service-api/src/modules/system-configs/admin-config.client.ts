import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { env } from '#/env';
import { MachineTokenService } from '#/infra/auth/machine/jwt/machine-token.service';

export interface RemoteSystemConfig {
  code: string
  value: unknown
  description: string | null
  updatedAt: string | Date
}

interface ConfigResponse {
  data: { configs: RemoteSystemConfig[] }
}

@Injectable()
export class AdminConfigClient {
  private readonly logger = new Logger(AdminConfigClient.name);

  constructor(
    private readonly machineTokenService: MachineTokenService,
    private readonly requestContext: RequestContext,
  ) {}

  async fetchSystemConfigs(): Promise<RemoteSystemConfig[]> {
    const requestId = this.requestContext.requestId;
    const credential = await this.machineTokenService.createCredential({
      targetService: 'admin-api',
    });

    const url = new URL('/api/v1/internal/system-configs', env.ADMIN_API_URL);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credential.value}`,
        ...(requestId ? { 'x-request-id': requestId } : {}),
      },
      signal: AbortSignal.timeout(TimeUtil.ms.second(5)),
    });

    if (!response.ok) {
      this.logger.error(`[Machine Config Request] admin-api responded with ${response.status}`);
      throw new ApplicationError({
        code: 'INTERNAL_SERVICE_CALL_FAILED',
        message: `Machine config request to admin-api failed: status ${response.status}`,
        status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status,
      });
    }

    const body = await response.json() as ConfigResponse;
    return body.data.configs;
  }
}
