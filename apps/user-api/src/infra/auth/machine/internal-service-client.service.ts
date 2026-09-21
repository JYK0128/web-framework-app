import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { env } from '#/env';

import { MACHINE_CREDENTIAL_SERVICE, type MachineCredentialService } from './machine-auth.interface';

interface InternalApiResponse<T> {
  data: T
}

@Injectable()
export class InternalServiceClient {
  private readonly logger = new Logger(InternalServiceClient.name);

  constructor(@Inject(MACHINE_CREDENTIAL_SERVICE) private readonly credentialService: MachineCredentialService, private readonly requestContext: RequestContext) {}

  async fetchServiceApi<T>(path: string): Promise<T> {
    const requestId = this.requestContext.requestId;
    const credential = await this.credentialService.createCredential({ targetService: 'service-api' });
    const url = new URL(path, env.SERVICE_API_URL).toString();
    try {
      const response = await fetch(url, { headers: { ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }), 'Content-Type': 'application/json', ...(requestId ? { 'x-request-id': requestId } : {}) } });
      if (!response.ok) {
        let details: unknown;
        try {
          details = await response.json();
        }
        catch {
          details = await response.text();
        }
        throw new ApplicationError({ code: 'INTERNAL_SERVICE_CALL_FAILED', message: `S2S machine call to service-api failed: status ${response.status}`, status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status, details });
      }
      const body = await response.json() as InternalApiResponse<T>;
      return body.data;
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach service-api at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', message: 'Could not connect to service-api', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }
}
