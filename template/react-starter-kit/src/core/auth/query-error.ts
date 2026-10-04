import { ApplicationError } from '@pkg/shared/common';
import { redirect } from '@tanstack/react-router';

export function unauthenticatedOrThrow(error: unknown, callback?: string): null {
  if (error instanceof ApplicationError) {
    if (error.status === 401) return null;
    if (error.code === 'USER_BANNED' || error.code === 'ACCOUNT_LOCKED' || error.status === 429) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/access-restricted',
        search: {
          code: error.code,
          status: error.status ? String(error.status) : undefined,
          message: error.message,
          callback,
        },
      });
    }
  }
  throw error;
}
