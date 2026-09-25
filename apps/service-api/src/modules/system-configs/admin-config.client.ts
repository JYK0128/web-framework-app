import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { env } from '#/env';
import { MachineTokenService } from '#/infra/auth/machine/jwt/machine-token.service';
import type { SupportRuntimeConfig } from '#/modules/support/support-runtime-config.service';

export interface RemoteSystemConfig {
  code: string
  value: unknown
  description: string | null
  updatedAt: string | Date
}

interface ConfigResponse {
  data: { configs: RemoteSystemConfig[] }
}

interface SupportRuntimeConfigResponse {
  data: SupportRuntimeConfig & {
    maintenance: {
      temporary: {
        enabled: boolean
        message: string
        startAt: string | null
        endAt: string | null
      }
      recurring: {
        enabled: boolean
        message: string
        daysOfWeek: number[]
        startTime: string
        endTime: string
      }
    }
  }
}

@Injectable()
export class AdminConfigClient {
  private readonly logger = new Logger(AdminConfigClient.name);

  constructor(
    private readonly machineTokenService: MachineTokenService,
    private readonly requestContext: RequestContext,
  ) {}

  async fetchSystemConfigs(): Promise<RemoteSystemConfig[]> {
    const body = await this.fetch<ConfigResponse>('/api/v1/internal/system-configs');
    return body.data.configs;
  }

  async fetchSupportRuntimeConfig(): Promise<SupportRuntimeConfigResponse['data']> {
    const body = await this.fetch<SupportRuntimeConfigResponse>('/api/v1/internal/system-configs/support-runtime');
    return body.data;
  }

  private async fetch<T>(path: string): Promise<T> {
    const requestId = this.requestContext.requestId;
    const credential = await this.machineTokenService.createCredential({
      targetService: 'admin-api',
    });

    const url = new URL(path, env.ADMIN_API_URL);
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

    return await response.json() as T;
  }
}
