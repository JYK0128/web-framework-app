export interface ApplicationErrorOptions {
  code: string
  message?: string
  status?: number
  details?: unknown
  params?: Record<string, unknown>
}

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

  public static from(
    value: unknown,
    fallback: string | Partial<ApplicationErrorOptions> = 'INTERNAL_ERROR',
  ): ApplicationError {
    if (value instanceof ApplicationError) return value;

    const fallbackCode = typeof fallback === 'string' ? fallback : (fallback?.code ?? 'INTERNAL_ERROR');
    const fallbackMessage = typeof fallback === 'object' ? fallback.message : undefined;
    const fallbackStatus = typeof fallback === 'object' ? fallback.status : undefined;
    const fallbackParams = typeof fallback === 'object' ? fallback.params : undefined;

    if (value instanceof Error) {
      return new ApplicationError({
        code: fallbackCode,
        message: value.message || fallbackMessage || fallbackCode,
        details: value.stack,
        status: fallbackStatus,
        params: fallbackParams,
      });
    }

    if (typeof value === 'string' && value.trim()) {
      return new ApplicationError({
        code: fallbackCode,
        message: value,
        status: fallbackStatus,
        params: fallbackParams,
      });
    }

    return new ApplicationError({
      code: fallbackCode,
      message: fallbackMessage || fallbackCode,
      status: fallbackStatus,
      details: value,
      params: fallbackParams,
    });
  }
}
