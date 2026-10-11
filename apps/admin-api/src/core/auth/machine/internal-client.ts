import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import axios from 'axios';

import { SECURITY_CONFIG } from '#/app.config';
import { MACHINE_AUTH_ISSUER, MACHINE_CONNECTION, type MachineAuthIssuer, type MachineConnection } from '#/core/auth/machine/machine-auth.interface';
import { RequestContext } from '#/core/http/contexts/request.context';

interface InternalApiResponse<T> {
  data: T
}

@Injectable()
export class InternalClient {
  private readonly client = axios.create({ validateStatus: () => true });

  private readonly logger = new Logger(InternalClient.name);

  constructor(@Inject(MACHINE_AUTH_ISSUER) private readonly authIssuer: MachineAuthIssuer, private readonly requestContext: RequestContext, @Inject(MACHINE_CONNECTION) private readonly connection: MachineConnection) {}

  async fetch<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown } = {}): Promise<T> {
    const credential = await this.authIssuer.issue({ targetService: this.connection.targetService });
    const url = this.targetUrl(path);
    try {
      const response = await this.client.request<InternalApiResponse<T>>({
        url,
        method: options.method ?? 'GET',
        timeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds),
        headers: { ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }), 'Content-Type': 'application/json', ...this.forwardedHeaders() },
        ...(options.body === undefined ? {} : { data: options.body }),
      });
      if (!isSuccessful(response.status)) {
        const details = parseResponseBody(response.data);
        if (isForwardableServiceConfigFailure(details)) {
          throw new ApplicationError({
            code: details.errorCode,
            status: HttpStatus.BAD_GATEWAY,
            details: details.details,
          });
        }
        throw new ApplicationError({ code: 'INTERNAL_SERVICE_CALL_FAILED', status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status, details });
      }
      return response.data.data;
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach ${this.connection.targetService} at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }

  async upload(path: string, body: Buffer, contentType: string): Promise<void> {
    const credential = await this.authIssuer.issue({ targetService: this.connection.targetService });
    const url = this.targetUrl(path);
    try {
      const response = await this.client.request({
        url,
        method: 'PUT',
        timeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds),
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          'Content-Type': contentType,
          ...this.forwardedHeaders(),
        },
        data: body,
      });
      if (!isSuccessful(response.status)) {
        const details = parseResponseBody(response.data);
        throw new ApplicationError({ code: 'INTERNAL_SERVICE_CALL_FAILED', status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status, details });
      }
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach ${this.connection.targetService} at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }

  async download(path: string): Promise<{ body: Buffer, contentType: string }> {
    const credential = await this.authIssuer.issue({ targetService: this.connection.targetService });
    const url = this.targetUrl(path);
    try {
      const response = await this.client.get<ArrayBuffer>(url, {
        timeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.internalServiceRequestTimeoutSeconds),
        responseType: 'arraybuffer',
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          ...this.forwardedHeaders(),
        },
      });
      if (!isSuccessful(response.status)) {
        const details = parseResponseBody(response.data);
        throw new ApplicationError({ code: 'INTERNAL_SERVICE_CALL_FAILED', status: response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status, details });
      }
      const contentType = response.headers['content-type'];
      return { body: Buffer.from(response.data), contentType: typeof contentType === 'string' ? contentType : 'application/octet-stream' };
    }
    catch (err: unknown) {
      if (err instanceof ApplicationError) throw err;
      this.logger.error(`[Machine Network Failure] Failed to reach ${this.connection.targetService} at ${url}`, err);
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, details: err instanceof Error ? err.message : String(err) });
    }
  }

  private forwardedHeaders(): Record<string, string> {
    const requestId = this.requestContext.requestId;
    const language = this.requestContext.request?.header('accept-language');
    return { ...(requestId ? { 'x-request-id': requestId } : {}), ...(language ? { 'accept-language': language } : {}) };
  }

  private targetUrl(path: string): string {
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(`/api/v1${relativePath}`, this.connection.baseUrl).toString();
  }
}

function parseResponseBody(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  }
  catch {
    return value;
  }
}

function isSuccessful(status: number): boolean {
  return status >= 200 && status < 300;
}

function isForwardableServiceConfigFailure(value: unknown): value is { errorCode: 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' | 'OAUTH_PROVIDER_CONFIG_INVALID', details?: unknown } {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Record<string, unknown>;
  return (body.errorCode === 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' || body.errorCode === 'OAUTH_PROVIDER_CONFIG_INVALID');
}
