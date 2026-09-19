import { RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { type Cookie, type SessionData, Store } from 'express-session';

import { RequestContext } from '#/common/contexts/request.context';
import type { UserPrincipal } from '#/common/types/principal.type';
import { SESSION_TTL_SECONDS } from '#/config';
import { Session } from '#/entities/auth/session.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class DatabaseSessionStore extends Store {
  constructor(private readonly em: AppEntityManager, private readonly requestContext: RequestContext) { super(); }

  override get(sessionId: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      const session = await this.em.findOne(Session, { token: sessionId }, { populate: ['user', 'user.role'] });
      if (!session || session.expiresAt <= new Date() || session.user.isBanned || session.user.isDeleted) {
        if (session) await this.em.nativeDelete(Session, { id: session.id });
        return null;
      }
      return { cookie: { originalMaxAge: Math.max(0, session.expiresAt.getTime() - session.createdAt.getTime()), expires: session.expiresAt, maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()) }, principal: this.toPrincipal(session.user) } satisfies SessionData;
    }).then((session) => callback(null, session), (error) => callback(error));
  }

  override set(sessionId: string, sessionData: SessionData, callback?: (error?: unknown) => void): void {
    void MikroRequestContext.create(this.em, async () => {
      const userId = sessionData.principal?.id;
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

  destroyAll(userId: string): Promise<void> {
    return MikroRequestContext.create(this.em, async () => {
      await this.em.nativeDelete(Session, { user: userId });
    });
  }

  private getExpiresAt(cookie: Cookie): Date { return cookie.expires ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000); }

  private toPrincipal(user: Session['user'] extends infer T ? T : never): UserPrincipal {
    const entity = user as unknown as { id: string, role?: { code: string, permissions?: string[] }, isBanned: boolean, isDeleted: boolean };
    return { type: 'user', id: entity.id, roles: entity.role ? [entity.role.code] : [], permissions: entity.role?.permissions ?? [] };
  }
}
