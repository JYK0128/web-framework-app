import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { API_BASE_PATH, ApplicationError, TimeUtil } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { SECURITY_CONFIG } from '#/config';
import { env } from '#/env';

import { MACHINE_CREDENTIAL_SERVICE, type MachineCredentialService } from './machine-auth.interface';

interface InternalApiResponse<T> {
  data: T
}

@Injectable()
export class InternalServiceClient {
  private readonly logger = new Logger(InternalServiceClient.name);

  constructor(@Inject(MACHINE_CREDENTIAL_SERVICE) private readonly credentialService: MachineCredentialService, private readonly requestContext: RequestContext) {}

  async fetchServiceApi<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown } = {}): Promise<T> {
    const requestId = this.requestContext.requestId;
    const credential = await this.credentialService.createCredential({ targetService: 'service-api' });
    const url = this.serviceApiUrl(path);
    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds)),
        headers: { ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }), 'Content-Type': 'application/json', ...(requestId ? { 'x-request-id': requestId } : {}) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      if (!response.ok) {
        let details: unknown;
        try {
          details = await response.json();
        }
        catch {
          details = await response.text();
        }
        if (isForwardableServiceConfigFailure(details)) {
          throw new ApplicationError({
            code: details.errorCode,
            message: details.message,
            status: HttpStatus.BAD_GATEWAY,
            details: details.details,
          });
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

  async uploadServiceApi(path: string, body: Buffer, contentType: string): Promise<void> {
    const requestId = this.requestContext.requestId;
    const credential = await this.credentialService.createCredential({ targetService: 'service-api' });
    const url = this.serviceApiUrl(path);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds)),
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          'Content-Type': contentType,
          ...(requestId ? { 'x-request-id': requestId } : {}),
        },
        body,
      });
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
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach service-api at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', message: 'Could not connect to service-api', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }

  async downloadServiceApiFile(path: string): Promise<{ body: Buffer, contentType: string }> {
    const requestId = this.requestContext.requestId;
    const credential = await this.credentialService.createCredential({ targetService: 'service-api' });
    const url = this.serviceApiUrl(path);
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds)),
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          ...(requestId ? { 'x-request-id': requestId } : {}),
        },
      });
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
      return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'application/octet-stream' };
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach service-api at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', message: 'Could not connect to service-api', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }

  private serviceApiUrl(path: string): string {
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(`${API_BASE_PATH}${relativePath}`, env.SERVICE_API_URL).toString();
  }
}

function isForwardableServiceConfigFailure(value: unknown): value is { errorCode: 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' | 'OAUTH_PROVIDER_CONFIG_INVALID', message: string, details?: unknown } {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Record<string, unknown>;
  return (body.errorCode === 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' || body.errorCode === 'OAUTH_PROVIDER_CONFIG_INVALID')
    && typeof body.message === 'string';
}
