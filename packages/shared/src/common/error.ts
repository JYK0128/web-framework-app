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
    fallback?: string | Partial<ApplicationErrorOptions>,
  ): ApplicationError {
    if (value instanceof ApplicationError) return value;

    const fallbackMessage = typeof fallback === 'string' ? fallback : fallback?.message;
    const fallbackCode = typeof fallback === 'object' ? fallback.code : undefined;
    const fallbackStatus = typeof fallback === 'object' ? fallback.status : undefined;

    if (value instanceof Error) {
      return new ApplicationError({
        code: fallbackCode ?? (value.name !== 'Error' ? value.name : 'INTERNAL_ERROR'),
        message: value.message || fallbackMessage || 'An unexpected error occurred',
        details: value.stack,
        status: fallbackStatus,
      });
    }

    if (typeof value === 'string' && value.trim()) {
      return new ApplicationError({
        code: fallbackCode ?? 'INTERNAL_ERROR',
        message: value,
        status: fallbackStatus,
      });
    }

    return new ApplicationError({
      code: fallbackCode ?? 'INTERNAL_ERROR',
      message: fallbackMessage || 'An unexpected error occurred',
      status: fallbackStatus,
      details: value,
    });
  }
}
