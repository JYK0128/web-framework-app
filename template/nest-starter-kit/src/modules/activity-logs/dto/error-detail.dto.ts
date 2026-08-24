import { ApiProperty } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

export interface CreateErrorDetailOptions {
  rawError?: unknown
  responseBody?: unknown
}

function parseResponseObject(responseBody: unknown): Record<string, unknown> | null {
  if (!responseBody) return null;
  if (typeof responseBody === 'object' && !Array.isArray(responseBody)) {
    return responseBody as Record<string, unknown>;
  }
  if (typeof responseBody === 'string') {
    try {
      const parsed = JSON.parse(responseBody) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
    catch {
      return null;
    }
  }
  return null;
}

function fromRawError(rawError: unknown): ErrorDetailDto | null {
  if (!rawError) return null;

  if (rawError instanceof ApplicationError) {
    return new ErrorDetailDto({
      name: rawError.name || 'ApplicationError',
      code: rawError.code,
      message: rawError.message || rawError.code,
      details: rawError.details ?? null,
      stack: rawError.stack ?? null,
      sql: null,
    });
  }

  if (rawError instanceof Error) {
    const errorRecord = rawError as unknown as Record<string, unknown>;
    return new ErrorDetailDto({
      name: rawError.name || 'Error',
      code: typeof errorRecord.code === 'string' ? errorRecord.code : null,
      message: rawError.message,
      details: null,
      stack: rawError.stack ?? null,
      sql: typeof errorRecord.sql === 'string' ? errorRecord.sql : null,
    });
  }

  if (typeof rawError === 'string') {
    return new ErrorDetailDto({
      name: 'Error',
      code: null,
      message: rawError,
      details: null,
      stack: null,
      sql: null,
    });
  }

  return null;
}

export class ErrorDetailDto {
  @ApiProperty({ description: '에러/예외 클래스명 (예: ApplicationError, TypeError)' })
  name!: string;

  @ApiProperty({ required: false, nullable: true, description: '비즈니스 에러 코드 (예: INVALID_TOKEN)' })
  code?: string | null;

  @ApiProperty({ description: '에러 메시지' })
  message!: string;

  @ApiProperty({ type: Object, required: false, nullable: true, description: '유효성 검사 등 상세 에러 내역' })
  details?: unknown;

  @ApiProperty({ required: false, nullable: true, description: '에러 호출 스택 트레이스' })
  stack?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'DB 예외 시 실행 SQL 쿼리' })
  sql?: string | null;

  constructor(partial?: Partial<ErrorDetailDto>) {
    Object.assign(this, partial);
  }

  static from(rawErrorOrOptions: unknown, responseBodyFallback?: unknown): ErrorDetailDto | null {
    if (!rawErrorOrOptions && !responseBodyFallback) return null;

    let rawError: unknown = rawErrorOrOptions;
    let responseBody: unknown = responseBodyFallback;

    if (rawErrorOrOptions && typeof rawErrorOrOptions === 'object') {
      const candidate = rawErrorOrOptions as Record<string, unknown>;
      if ('rawError' in candidate || 'responseBody' in candidate) {
        rawError = candidate.rawError;
        responseBody = candidate.responseBody ?? responseBodyFallback;
      }
    }

    return fromRawError(rawError) ?? ErrorDetailDto.fromResponse(responseBody);
  }

  static fromResponse(responseBody: unknown): ErrorDetailDto | null {
    const resObj = parseResponseObject(responseBody);
    if (!resObj) {
      if (typeof responseBody === 'string' && responseBody.trim()) {
        return new ErrorDetailDto({
          name: 'HttpError',
          code: null,
          message: responseBody,
          details: null,
          stack: null,
          sql: null,
        });
      }
      return null;
    }

    let code: string | null = null;
    if (typeof resObj.errorCode === 'string') {
      code = resObj.errorCode;
    }
    else if (typeof resObj.error === 'string') {
      code = resObj.error;
    }

    const msg = typeof resObj.message === 'string' ? resObj.message : undefined;
    if (!code && !msg) return null;

    return new ErrorDetailDto({
      name: 'HttpError',
      code,
      message: msg ?? code ?? 'Unknown HTTP Error',
      details: resObj.details ?? null,
      stack: null,
      sql: null,
    });
  }
}
