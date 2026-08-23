export interface ApplicationErrorOptions {
  code: string
  message?: string
  status?: number
  details?: unknown
  params?: Record<string, unknown>
}

/**
 * Pure Protocol-Agnostic Universal Domain Error Class
 * Single Unified Error Class for the Entire Monorepo
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;
  public readonly params?: Record<string, unknown>;

  constructor(options: ApplicationErrorOptions) {
    super(options.message || options.code);
    this.name = 'ApplicationError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.params = options.params;
  }

  public toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      params: this.params,
    };
  }

  /**
   * unknown 예외를 단일 모노레포 표준인 ApplicationError 인스턴스로 변환
   */
  public static toError(
    value: unknown,
    fallback: string | ApplicationErrorOptions = 'INTERNAL_ERROR',
  ): ApplicationError {
    if (value instanceof ApplicationError) return value;

    const fallbackOptions: ApplicationErrorOptions = typeof fallback === 'string'
      ? { code: fallback, message: fallback }
      : fallback;

    if (value instanceof Error) {
      return new ApplicationError({
        code: fallbackOptions.code,
        message: value.message || fallbackOptions.message,
        details: value.stack,
        status: fallbackOptions.status,
      });
    }

    if (typeof value === 'string' && value.trim()) {
      return new ApplicationError({
        code: fallbackOptions.code,
        message: value,
        status: fallbackOptions.status,
      });
    }

    return new ApplicationError(fallbackOptions);
  }

  /**
   * unknown 예외에서 안전하게 에러 메시지 문자열만 추출
   */
  public static getMessage(
    value: unknown,
    fallback: string | ApplicationErrorOptions = 'INTERNAL_ERROR',
  ): string {
    return ApplicationError.toError(value, fallback).message;
  }
}
