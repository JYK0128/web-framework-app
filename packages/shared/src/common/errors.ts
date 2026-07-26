export interface AppErrorOptions {
  code: string
  details?: unknown
  params?: Record<string, unknown>
}

/**
 * Pure Protocol-Agnostic Universal Domain Error Class
 * Single Unified Error Class for the Entire Monorepo
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly params?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.code);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.params = options.params;
  }

  public toJSON() {
    return {
      code: this.code,
      details: this.details,
      params: this.params,
    };
  }
}
