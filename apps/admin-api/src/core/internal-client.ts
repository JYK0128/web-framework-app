import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { MACHINE_AUTH_ISSUER, MACHINE_CONNECTION, type MachineAuthIssuer, type MachineConnection } from '@pkg/server-core/auth/machine/machine-auth.interface';
import { RequestContext } from '@pkg/server-core/http/contexts/request.context';
import { ApplicationError } from '@pkg/shared/common';

import { httpClient } from '#/core/http-client';

interface InternalApiResponse<T> {
  data: T
}

@Injectable()
export class InternalClient {
  private readonly logger = new Logger(InternalClient.name);

  constructor(@Inject(MACHINE_AUTH_ISSUER) private readonly authIssuer: MachineAuthIssuer, private readonly requestContext: RequestContext, @Inject(MACHINE_CONNECTION) private readonly connection: MachineConnection) {}

  async fetch<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown } = {}): Promise<T> {
    const credential = await this.authIssuer.issue({ targetService: this.connection.targetService });
    const url = this.targetUrl(path);
    try {
      const response = await httpClient.request<InternalApiResponse<T>>({
        url,
        method: options.method ?? 'GET',
        headers: { ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }), 'Content-Type': 'application/json', ...this.forwardedHeaders() },
        ...(options.body === undefined ? {} : { data: options.body }),
      });
      if (!isSuccessful(response.status)) {
        throw upstreamError(response.status, response.data);
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
      const response = await httpClient.request({
        url,
        method: 'PUT',
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          'Content-Type': contentType,
          ...this.forwardedHeaders(),
        },
        data: body,
      });
      if (!isSuccessful(response.status)) {
        throw upstreamError(response.status, response.data);
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
      const response = await httpClient.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: {
          ...(credential.type === 'bearer' ? { Authorization: `Bearer ${credential.value}` } : { 'x-api-key': credential.value }),
          ...this.forwardedHeaders(),
        },
      });
      if (!isSuccessful(response.status)) {
        throw upstreamError(response.status, response.data);
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
  if (Buffer.isBuffer(value)) value = value.toString('utf8');
  else if (value instanceof ArrayBuffer) value = Buffer.from(value).toString('utf8');
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

function upstreamError(status: number, value: unknown): ApplicationError {
  const body = parseResponseBody(value);
  const response = isRecord(body) ? body : undefined;
  const code = typeof response?.errorCode === 'string' && response.errorCode.trim() ? response.errorCode : 'INTERNAL_SERVICE_CALL_FAILED';
  const meta = isRecord(response?.meta) ? response.meta : undefined;
  return new ApplicationError({
    code,
    status: status >= 500 ? HttpStatus.BAD_GATEWAY : status,
    details: code === 'INTERNAL_SERVICE_CALL_FAILED' ? body : response?.details,
    params: isRecord(meta?.params) ? meta.params : undefined,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
