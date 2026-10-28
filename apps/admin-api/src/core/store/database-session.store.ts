import { RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { SessionStore } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { RequestContext } from '@pkg/server-core/http/contexts';
import { type Cookie, type SessionData } from 'express-session';

import { SECURITY_CONFIG } from '~/app.config';
import { Session } from '~/core/database/entities/auth';

@Injectable()
export class DatabaseSessionStore extends SessionStore {
  constructor(private readonly em: AppEntityManager, private readonly requestContext: RequestContext) { super(); }

  override get(sessionId: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      const session = await this.em.findOne(Session, { token: sessionId }, { populate: ['user'] });
      if (!session || session.expiresAt <= new Date() || session.user.isBanned || session.user.isDeleted) {
        if (session) await this.em.nativeDelete(Session, { id: session.id });
        return null;
      }
      return { cookie: { originalMaxAge: Math.max(0, session.expiresAt.getTime() - session.createdAt.getTime()), expires: session.expiresAt, maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()) }, userId: session.user.id } satisfies SessionData;
    }).then((session) => callback(null, session), (error) => callback(error));
  }

  override set(sessionId: string, sessionData: SessionData, callback?: (error?: unknown) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      const userId = sessionData.userId;
      if (!userId) {
        await this.em.nativeDelete(Session, { token: sessionId });
        return;
      }
      await this.em.upsert(Session, { token: sessionId, user: userId, expiresAt: this.getExpiresAt(sessionData.cookie), ipAddress: this.requestContext.ipAddress, userAgent: this.requestContext.userAgent }, { onConflictFields: ['token'] });
    }).then(() => callback?.(), (error) => callback?.(error));
  }

  override touch(sessionId: string, sessionData: SessionData, callback?: (error?: unknown) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      await this.em.nativeUpdate(Session, { token: sessionId }, { expiresAt: this.getExpiresAt(sessionData.cookie), updatedAt: new Date() });
    }).then(() => callback?.(), (error) => callback?.(error));
  }

  override destroy(sessionId: string, callback?: (error?: unknown) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      await this.em.nativeDelete(Session, { token: sessionId });
    }).then(() => callback?.(), (error) => callback?.(error));
  }

  override destroyAll(userId: string): Promise<void> {
    return MikroRequestContext.create(this.em, async () => {
      await this.em.nativeDelete(Session, { user: userId });
    });
  }

  private getExpiresAt(cookie: Cookie): Date { return cookie.expires ?? new Date(Date.now() + SECURITY_CONFIG.token.refreshIdleTimeoutMinutes * 60_000); }
}
