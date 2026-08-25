import type { TFunction } from '@pkg/shared/server';

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
