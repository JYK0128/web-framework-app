import { ApiProperty } from '@nestjs/swagger';
import { ApplicationError, jsonSafeParse } from '@pkg/shared/common';

import { BaseDto } from '#/common/dto/base.dto';

function extractHttpCode(obj: Record<string, unknown>): string | null {
  if (typeof obj.errorCode === 'string') return obj.errorCode;
  if (typeof obj.error === 'string') return obj.error;
  return null;
}

export class LogErrorInfoDto extends BaseDto {
  @ApiProperty({ description: '에러/예외 클래스명 (예: ApplicationError, TypeError)' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, description: '비즈니스 에러 코드 (예: INVALID_TOKEN)' })
  code!: string | null;

  @ApiProperty({ description: '에러 메시지' })
  message!: string;

  @ApiProperty({ type: Object, nullable: true, additionalProperties: true, description: '유효성 검사 등 상세 에러 내역' })
  details!: unknown;

  @ApiProperty({ type: String, nullable: true, description: '에러 호출 스택 트레이스' })
  stack!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'DB 예외 시 실행 SQL 쿼리' })
  sql!: string | null;

  static from(rawError?: unknown, responseBody?: unknown): LogErrorInfoDto | null {
    return this.fromRawError(rawError) ?? this.fromResponseBody(responseBody);
  }

  private static fromRawError(rawError?: unknown): LogErrorInfoDto | null {
    if (rawError instanceof ApplicationError) {
      return LogErrorInfoDto.fromPlain({
        name: rawError.name || 'ApplicationError',
        code: rawError.code,
        message: rawError.message || rawError.code,
        details: rawError.details ?? null,
        stack: rawError.stack ?? null,
        sql: null,
      });
    }

    if (rawError instanceof Error) {
      const err = rawError as unknown as Record<string, unknown>;
      return LogErrorInfoDto.fromPlain({
        name: rawError.name || 'Error',
        code: typeof err.code === 'string' ? err.code : null,
        message: rawError.message,
        details: null,
        stack: rawError.stack ?? null,
        sql: typeof err.sql === 'string' ? err.sql : null,
      });
    }

    if (typeof rawError === 'string' && rawError.trim()) {
      return LogErrorInfoDto.fromPlain({
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

  private static fromResponseBody(responseBody?: unknown): LogErrorInfoDto | null {
    const res = typeof responseBody === 'string' ? jsonSafeParse<Record<string, unknown>>(responseBody) : responseBody;
    if (!res || typeof res !== 'object' || Array.isArray(res)) {
      return null;
    }

    const resObj = res as Record<string, unknown>;
    const code = extractHttpCode(resObj);
    const message = typeof resObj.message === 'string' ? resObj.message : code;
    if (!message) return null;

    return LogErrorInfoDto.fromPlain({
      name: 'HttpError',
      code,
      message,
      details: resObj.details ?? null,
      stack: null,
      sql: null,
    });
  }
}
