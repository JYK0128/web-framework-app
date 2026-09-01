import { ApplicationError } from '@pkg/shared/common';

export function unauthenticatedOrThrow(error: unknown): null {
  if (error instanceof ApplicationError && error.status === 401) return null;
  throw error;
}
