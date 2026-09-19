import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { env } from '#/env';

import { MachineTokenService } from './machine-token.service';

@Injectable()
export class InternalServiceClient {
  private readonly logger = new Logger(InternalServiceClient.name);

  constructor(
    private readonly machineTokenService: MachineTokenService,
    private readonly cls: ClsService,
  ) {}

  async fetchServiceApi<T>(path: string): Promise<T> {
    const requestId = this.cls.get<string>('requestId');

    const machineToken = await this.machineTokenService.createMachineToken({
      targetService: 'service-api',
    });

    const url = new URL(path, env.SERVICE_API_URL).toString();
    const method = 'GET';

    this.logger.debug(`[Machine Call] ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${machineToken}`,
          'Content-Type': 'application/json',
          ...(requestId ? { 'x-request-id': requestId } : {}),
        },
      });

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        }
        catch {
          errorData = await response.text();
        }

        this.logger.error(`[Machine Error] ${method} ${url} responded with ${response.status}`, errorData);
        throw new ApplicationError({
          code: 'INTERNAL_SERVICE_CALL_FAILED',
          message: `S2S machine call to service-api failed: status ${response.status}`,
          status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status,
          details: errorData,
        });
      }

      return (await response.json()) as T;
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;

      this.logger.error(`[Machine Network Failure] Failed to reach service-api at ${url}`, err);
      throw new ApplicationError({
        code: 'INTERNAL_SERVICE_UNAVAILABLE',
        message: 'Could not connect to service-api',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
