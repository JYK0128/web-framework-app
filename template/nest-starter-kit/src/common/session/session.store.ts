import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { type Cookie, type SessionData, Store } from 'express-session';
import { ClsService } from 'nestjs-cls';

import { getCookieOptions } from '#/common/session/cookie.config';
import { Session as AuthSession } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@Injectable()
export class SessionStore extends Store {
  constructor(
    @Inject(EntityManager) private readonly entityManager: EntityManager,
    private readonly cls: ClsService,
  ) {
    super();
  }

  async ensureAnonymousSession(sid: string): Promise<void> {
    await this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      if (authSession) {
        if (authSession.expiresAt.getTime() > Date.now()) {
          if (this.cls.isActive()) this.cls.set('user', authSession.user);
          return;
        }
        await em.nativeDelete(AuthSession, { id: authSession.id });
      }

      const user = this.createAnonymousUser(em, sid);
      em.persist(user);

      const session = this.createAuthSession(em, sid, user);
      em.persist(session);

      if (this.cls.isActive()) this.cls.set('user', user);
    });
  }

  async linkAnonymousUser(userId: string): Promise<void> {
    const anonymousUser = this.cls.get('user');
    if (!anonymousUser?.isAnonymous || anonymousUser.id === userId) return;

    await this.withEntityManager(async (em) => {
      const user = em.getReference(User, userId);
      const sessions = await em.find(AuthSession, { user: anonymousUser.id });

      for (const session of sessions) {
        session.user = user;
      }
      await em.flush();

      await em.nativeDelete(User, { id: anonymousUser.id });
      if (this.cls.isActive()) this.cls.set('user', user);
    });
  }

  async saveAuthenticatedSession(sid: string, userId: string, expiresAt: Date): Promise<void> {
    await this.withEntityManager(async (em) => {
      const user = await em.findOneOrFail(User, { id: userId });
      let authSession = await em.findOne(AuthSession, { token: sid });

      if (authSession) {
        this.updateAuthSession(em, authSession, { user, expiresAt });
      }
      else {
        authSession = this.createAuthSession(em, sid, user, { expiresAt });
        em.persist(authSession);
      }

      if (this.cls.isActive()) this.cls.set('user', user);
    });
  }

  override get(sid: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      if (!authSession) return null;

      if (authSession.expiresAt.getTime() <= Date.now()) {
        await em.nativeDelete(AuthSession, { id: authSession.id });
        return null;
      }

      if (this.cls.isActive()) this.cls.set('user', authSession.user);
      if (this.cls.isActive()) {
        this.cls.set(
          'isTwoFactorAuthenticated',
          authSession.metadata?.isTwoFactorAuthenticated === true,
        );
      }

      return {
        ...authSession.metadata,
        cookie: getCookieOptions({
          originalMaxAge: env.SESSION_TTL_SECONDS * 1000,
          maxAge: Math.max(0, authSession.expiresAt.getTime() - Date.now()),
          expires: authSession.expiresAt,
        }),
      } satisfies SessionData;
    }).then(
      (data) => callback(null, data),
      (error) => callback(error),
    );
  }

  override set(
    sid: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      const expiresAt = this.getExpiresAt(sessionData.cookie);
      const metadata = this.getSessionMetadata(sessionData);

      if (authSession) {
        this.updateAuthSession(em, authSession, { expiresAt, metadata });
        if (this.cls.isActive()) this.cls.set('user', authSession.user);
        return;
      }

      const user = this.createAnonymousUser(em, sid);
      em.persist(user);

      const session = this.createAuthSession(em, sid, user, { expiresAt, metadata });
      em.persist(session);

      if (this.cls.isActive()) this.cls.set('user', user);
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  override destroy(sid: string, callback?: (error?: unknown) => void): void {
    void this.withEntityManager(async (em) => {
      await em.nativeDelete(AuthSession, { token: sid });
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  override touch(
    sid: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid });
      if (!authSession) return;

      authSession.expiresAt = this.getExpiresAt(sessionData.cookie);
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  private getExpiresAt(cookie?: Cookie): Date {
    return cookie?.expires ?? new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
  }

  private createAnonymousUser(em: EntityManager, sid: string): User {
    return em.create(User, {
      name: 'Anonymous',
      email: `${sid}@anonymous.com`,
      isAnonymous: true,
    });
  }

  private createAuthSession(
    em: EntityManager,
    sid: string,
    user: User,
    data: { expiresAt?: Date, metadata?: Record<string, unknown> } = {},
  ): AuthSession {
    const tracking = this.cls.get('tracking');

    return em.create(AuthSession, {
      token: sid,
      user,
      expiresAt: data.expiresAt ?? this.getExpiresAt(),
      ipAddress: tracking?.ipAddress ?? null,
      userAgent: tracking?.userAgent ?? null,
      metadata: {
        ...data.metadata,
        requestTracking: tracking,
      },
    });
  }

  private updateAuthSession(
    em: EntityManager,
    session: AuthSession,
    data: { expiresAt?: Date, metadata?: Record<string, unknown>, user?: User },
  ): void {
    const tracking = this.cls.get('tracking');

    em.assign(session, {
      ...data,
      ipAddress: tracking?.ipAddress ?? null,
      userAgent: tracking?.userAgent ?? null,
      metadata: {
        ...session.metadata,
        ...data.metadata,
        requestTracking: tracking,
      },
    });
  }

  private getSessionMetadata(sessionData: SessionData): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(sessionData).filter(([key]) => key !== 'cookie'),
    );
  }

  private withEntityManager<T>(callback: (em: EntityManager) => Promise<T>): Promise<T> {
    return RequestContext.create(this.entityManager, async () => {
      const em = RequestContext.getEntityManager();
      if (!em) {
        throw new Error('EntityManager is not available in RequestContext');
      }
      const result = await callback(em);
      await em.flush();
      return result;
    });
  }
}
