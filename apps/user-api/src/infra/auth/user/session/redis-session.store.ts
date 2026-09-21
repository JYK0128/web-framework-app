import { Injectable } from '@nestjs/common';
import { type SessionData, Store } from 'express-session';

import { SESSION_TTL_SECONDS } from '#/config';
import { KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';

@Injectable()
export class RedisSessionStore extends Store {
  constructor(private readonly kvStore: KvStore) { super(); }

  override get(sessionId: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.kvStore.get<SessionData>(KvStoreKey.auth.session(sessionId))
      .then((session) => callback(null, session ? this.restoreCookie(session) : null), (error) => callback(error));
  }

  override set(sessionId: string, session: SessionData, callback?: (error?: unknown) => void): void {
    void this.kvStore.set(KvStoreKey.auth.session(sessionId), session, this.ttl(session))
      .then(() => callback?.(), (error) => callback?.(error));
  }

  override touch(sessionId: string, session: SessionData, callback?: (error?: unknown) => void): void {
    this.set(sessionId, session, callback);
  }

  override destroy(sessionId: string, callback?: (error?: unknown) => void): void {
    void this.kvStore.del(KvStoreKey.auth.session(sessionId)).then(() => callback?.(), (error) => callback?.(error));
  }

  private ttl(session: SessionData): number {
    const expiresAt = session.cookie.expires?.getTime() ?? Date.now() + SESSION_TTL_SECONDS * 1000;
    return Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  private restoreCookie(session: SessionData): SessionData {
    if (session.cookie.expires && typeof session.cookie.expires === 'string') session.cookie.expires = new Date(session.cookie.expires);
    return session;
  }
}
