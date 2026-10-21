import { Inject, Injectable } from '@nestjs/common';
import { SessionStore, USER_SESSION_OPTIONS, type UserSessionOptions } from '@pkg/server-core/auth';
import { KvStore } from '@pkg/server-core/kv-store';
import { type SessionData } from 'express-session';

import { SERVICE_ID } from '~/app.config';

@Injectable()
export class RedisSessionStore extends SessionStore {
  constructor(
    private readonly kvStore: KvStore,
    @Inject(USER_SESSION_OPTIONS) private readonly options: UserSessionOptions,
  ) { super(); }

  private key(id: string): string { return `${SERVICE_ID}:auth_session:${id}`; }

  override get(id: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.kvStore.get<SessionData & { principal?: { id?: unknown } }>(this.key(id)).then((value) => {
      if (!value) return callback(null, null);
      const session = this.restoreCookie(value);
      if (!session.userId && typeof value.principal?.id === 'string') session.userId = value.principal.id;
      delete value.principal;
      callback(null, session);
    }, callback);
  }

  override set(id: string, session: SessionData, callback?: (error?: unknown) => void): void {
    void this.save(id, session).then(() => callback?.(), callback);
  }

  override touch(id: string, session: SessionData, callback?: (error?: unknown) => void): void { this.set(id, session, callback); }
  override destroy(id: string, callback?: (error?: unknown) => void): void { void this.remove(id).then(() => callback?.(), callback); }

  override async destroyAll(userId: string): Promise<void> {
    const indexKey = this.userKey(userId);
    const sessions = await this.kvStore.hGetAll(indexKey);
    for (const id of Object.keys(sessions)) {
      const session = await this.kvStore.get<SessionData>(this.key(id));
      if (session?.userId === userId) await this.kvStore.del(this.key(id));
      await this.kvStore.hDel(indexKey, id);
    }
  }

  private userKey(userId: string): string { return `${SERVICE_ID}:auth_user_sessions:${userId}`; }

  private async save(id: string, session: SessionData): Promise<void> {
    const previous = await this.kvStore.get<SessionData>(this.key(id));
    if (previous?.userId && previous.userId !== session.userId) {
      await this.kvStore.hDel(this.userKey(previous.userId), id);
    }
    const ttl = this.ttl(session);
    if (session.userId) {
      const indexKey = this.userKey(session.userId);
      await this.kvStore.hSet(indexKey, id, '1');
      const currentTtl = await this.kvStore.getTtlSeconds(indexKey);
      await this.kvStore.expire(indexKey, Math.max(currentTtl ?? 0, ttl));
    }
    await this.kvStore.set(this.key(id), session, ttl);
  }

  private async remove(id: string): Promise<void> {
    const session = await this.kvStore.getAndDelete<SessionData>(this.key(id));
    if (session?.userId) await this.kvStore.hDel(this.userKey(session.userId), id);
  }

  private ttl(session: SessionData): number {
    const expiresAt = session.cookie.expires?.getTime() ?? Date.now() + this.options.refreshIdleTimeoutMinutes * 60_000;
    return Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  private restoreCookie(session: SessionData): SessionData {
    if (session.cookie.expires && typeof session.cookie.expires === 'string') session.cookie.expires = new Date(session.cookie.expires);
    return session;
  }
}
