import { ApplicationError, jsonSafeParse } from '@pkg/shared/common';

export interface NormalizedLogError {
  name: string
  code: string | null
  message: string
  details: unknown
  stack: string | null
  sql: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringProperty(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const property = value[key];
  return typeof property === 'string' ? property : null;
}

function fromRawError(rawError: unknown): NormalizedLogError | null {
  if (rawError instanceof ApplicationError) {
    return {
      name: rawError.name || 'ApplicationError',
      code: rawError.code,
      message: rawError.message || rawError.code,
      details: rawError.details ?? null,
      stack: rawError.stack ?? null,
      sql: null,
    };
  }

  if (rawError instanceof Error) {
    return {
      name: rawError.name || 'Error',
      code: readStringProperty(rawError, 'code'),
      message: rawError.message,
      details: null,
      stack: rawError.stack ?? null,
      sql: readStringProperty(rawError, 'sql'),
    };
  }

  if (typeof rawError === 'string' && rawError.trim()) {
    return { name: 'Error', code: null, message: rawError, details: null, stack: null, sql: null };
  }

  return null;
}

function fromResponseBody(responseBody: unknown): NormalizedLogError | null {
  const response = typeof responseBody === 'string'
    ? jsonSafeParse<Record<string, unknown>>(responseBody)
    : responseBody;
  if (!isRecord(response)) return null;

  let code: string | null = null;
  if (typeof response.errorCode === 'string') code = response.errorCode;
  else if (typeof response.error === 'string') code = response.error;
  const message = typeof response.message === 'string' ? response.message : code;
  if (!message) return null;

  return {
    name: 'HttpError',
    code,
    message,
    details: response.details ?? null,
    stack: null,
    sql: null,
  };
}

export function normalizeLogError(rawError?: unknown, responseBody?: unknown): NormalizedLogError | null {
  return fromRawError(rawError) ?? fromResponseBody(responseBody);
}
