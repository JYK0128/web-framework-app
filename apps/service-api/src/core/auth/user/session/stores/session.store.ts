import type { Provider } from '@nestjs/common';

import { DatabaseSessionStore } from '#/core/auth/user/session/stores/database-session.store';
import { RedisSessionStore } from '#/core/auth/user/session/stores/redis-session.store';
import type { AuthStoreDriver } from '#/core/auth/user/user-auth.interface';

export const SESSION_STORE = Symbol('SESSION_STORE');

export function createSessionStoreProviders(driver: AuthStoreDriver = 'database'): Provider[] {
  const store = driver === 'redis' ? RedisSessionStore : DatabaseSessionStore;
  return [store, { provide: SESSION_STORE, useExisting: store }];
}
