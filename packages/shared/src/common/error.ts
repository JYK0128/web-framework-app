import type { i18n } from 'i18next';

export interface ApplicationErrorOptions {
  code: string
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
    super(options.code);
    this.name = 'ApplicationError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.params = options.params;
  }

  public toJSON<TCode extends string = string>(options?: {
    path?: string
    requestId?: string
    i18n?: Pick<i18n, 't'>
  }) {
    return {
      success: false as const,
      statusCode: this.status ?? 400,
      path: options?.path ?? '-',
      requestId: options?.requestId ?? '-',
      timestamp: new Date().toISOString(),
      message: options?.i18n ? this.translate(options.i18n) : this.code,
      data: null,
      errorCode: ApplicationError.getErrorCode<TCode>(this.code),
      meta: this.params ? { params: this.params } : undefined,
      details: this.details,
    };
  }

  public translate(i18n: Pick<i18n, 't'>): string {
    return i18n.t(`error.${this.code}`, { ...this.params, defaultValue: this.code });
  }

  public static getErrorCode<TCode extends string = string>(code: string): TCode {
    return code as TCode;
  }

  public static from(
    value: unknown,
    fallback: string | Partial<ApplicationErrorOptions> = 'INTERNAL_ERROR',
  ): ApplicationError {
    if (value instanceof ApplicationError) return value;

    const options = typeof fallback === 'string' ? { code: fallback } : fallback;
    const error = new ApplicationError({
      ...options,
      code: options.code ?? 'INTERNAL_ERROR',
    });
    if (value instanceof Error) error.cause = value;
    return error;
  }
}
