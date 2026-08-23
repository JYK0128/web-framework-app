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
   * unknown 예외를 안전한 표준 Error 객체로 변환
   */
  public static toError(value: unknown, fallbackMessage: string): Error {
    if (value instanceof Error) return value;
    if (typeof value === 'string' && value) return new Error(value);
    return new Error(fallbackMessage);
  }

  /**
   * unknown 예외에서 안전하게 에러 메시지 문자열만 추출
   */
  public static getMessage(value: unknown, fallbackMessage: string): string {
    return ApplicationError.toError(value, fallbackMessage).message;
  }
}
