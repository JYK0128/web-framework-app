import type { TFunction } from 'i18next';

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      rawError?: unknown
      t: TFunction
    }

    interface Response {
      body?: unknown
    }
  }
}

export {};
