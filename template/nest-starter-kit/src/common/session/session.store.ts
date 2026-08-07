import { EntityManager, raw, wrap } from '@mikro-orm/core';
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
        if (!authSession.expiresAt || authSession.expiresAt.getTime() > Date.now()) {
          if (this.cls.isActive()) this.cls.set('user', wrap(authSession.user).toPOJO());
          return;
        }
        await em.nativeDelete(AuthSession, { id: authSession.id });
      }

      const session = await this.upsertAnonymousSession(em, sid);

      if (this.cls.isActive()) this.cls.set('user', wrap(session.user).toPOJO());
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
      const updatedUser = await em.findOneOrFail(User, { id: userId });
      if (this.cls.isActive()) this.cls.set('user', wrap(updatedUser).toPOJO());
    });
  }

  async saveAuthenticatedSession(sid: string, userId: string, expiresAt: Date | null): Promise<void> {
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

      if (this.cls.isActive()) this.cls.set('user', wrap(user).toPOJO());
    });
  }

  override get(sid: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      if (!authSession) return null;

      if (authSession.expiresAt && authSession.expiresAt.getTime() <= Date.now()) {
        await em.nativeDelete(AuthSession, { id: authSession.id });
        return null;
      }

      const oauthState = authSession.metadata?.oauthState;

      if (this.cls.isActive()) {
        this.cls.set('user', wrap(authSession.user).toPOJO());
        this.cls.set(
          'isTwoFactorAuthenticated',
          authSession.metadata?.isTwoFactorAuthenticated === true,
        );
        this.cls.set(
          'oauthState',
          oauthState ?? null,
        );
      }

      const cookie: Cookie = {
        ...getCookieOptions(),
        originalMaxAge: authSession.expiresAt && env.SESSION_TTL_SECONDS > 0 ? env.SESSION_TTL_SECONDS * 1000 : null,
        expires: (authSession.expiresAt && env.SESSION_TTL_SECONDS > 0) ? authSession.expiresAt : null,
        ...(authSession.expiresAt && env.SESSION_TTL_SECONDS > 0
          ? { maxAge: Math.max(0, authSession.expiresAt.getTime() - Date.now()) }
          : {}),
      };

      return { cookie } satisfies SessionData;
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

      const { cookie, ...metadata } = sessionData;
      const expiresAt = this.getExpiresAt(cookie);

      if (authSession) {
        this.updateAuthSession(em, authSession, { expiresAt, metadata });
        if (this.cls.isActive()) this.cls.set('user', wrap(authSession.user).toPOJO());
        return;
      }

      const session = await this.upsertAnonymousSession(em, sid, { expiresAt, metadata });

      if (this.cls.isActive()) this.cls.set('user', wrap(session.user).toPOJO());
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

  async setOAuthState(sid: string, state: string): Promise<void> {
    await this.withEntityManager(async (em) => {
      const authSession = await em.findOneOrFail(AuthSession, { token: sid });
      this.updateAuthSession(em, authSession, { metadata: { oauthState: state } });

      if (this.cls.isActive()) this.cls.set('oauthState', state);
    });
  }

  async consumeOAuthState(sid: string, receivedState: unknown): Promise<boolean> {
    if (typeof receivedState !== 'string') return false;

    const affectedRows = await this.entityManager.fork().nativeUpdate(
      AuthSession,
      {
        token: sid,
        [raw('json_extract(metadata, ?)', ['$.oauthState'])]: receivedState,
      },
      {
        metadata: raw('json_remove(metadata, ?)', ['$.oauthState']),
      },
    );

    if (affectedRows !== 1) return false;
    if (this.cls.isActive()) this.cls.set('oauthState', null);
    return true;
  }

  override touch(
    sid: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid });
      if (!authSession || !authSession.expiresAt) return;

      const remainingTime = authSession.expiresAt.getTime() - Date.now();
      const thresholdMs = env.SESSION_ROLLING_THRESHOLD_SECONDS * 1000;
      if (remainingTime > thresholdMs) return;

      authSession.expiresAt = this.getExpiresAt(sessionData.cookie);
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  private getExpiresAt(cookie?: Cookie): Date | null {
    if (env.SESSION_TTL_SECONDS === -1) {
      return null;
    }
    if (cookie?.expires) {
      return cookie.expires;
    }
    return new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
  }

  private async upsertAnonymousSession(
    em: EntityManager,
    sid: string,
    data: { expiresAt?: Date | null, metadata?: Record<string, unknown> } = {},
  ): Promise<AuthSession> {
    const clientContext = this.cls.get('clientContext');
    const user = await em.upsert(User, {
      name: 'Anonymous',
      email: `${sid}@anonymous.com`,
      isAnonymous: true,
    }, {
      onConflictFields: ['email'],
      onConflictAction: 'ignore',
    });

    await em.upsert(AuthSession, {
      token: sid,
      user,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : this.getExpiresAt(),
      ipAddress: clientContext?.ipAddress ?? null,
      userAgent: clientContext?.userAgent ?? null,
      metadata: {
        ...data.metadata,
        clientContext,
      },
    }, {
      onConflictFields: ['token'],
      onConflictAction: 'ignore',
    });

    return em.findOneOrFail(AuthSession, { token: sid }, { populate: ['user'] });
  }

  private createAuthSession(
    em: EntityManager,
    sid: string,
    user: User,
    data: { expiresAt?: Date | null, metadata?: Record<string, unknown> } = {},
  ): AuthSession {
    const clientContext = this.cls.get('clientContext');

    return em.create(AuthSession, {
      token: sid,
      user,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : this.getExpiresAt(),
      ipAddress: clientContext?.ipAddress ?? null,
      userAgent: clientContext?.userAgent ?? null,
      metadata: {
        ...data.metadata,
        clientContext,
      },
    });
  }

  private updateAuthSession(
    em: EntityManager,
    session: AuthSession,
    data: { expiresAt?: Date | null, metadata?: Record<string, unknown>, user?: User },
  ): void {
    const clientContext = this.cls.get('clientContext');

    em.assign(session, {
      ...data,
      ipAddress: clientContext?.ipAddress ?? null,
      userAgent: clientContext?.userAgent ?? null,
      metadata: {
        ...session.metadata,
        ...data.metadata,
        clientContext,
      },
    });
  }

  private async withEntityManager<T>(callback: (em: EntityManager) => Promise<T>): Promise<T> {
    const em = this.entityManager.fork();
    const result = await callback(em);
    await em.flush();
    return result;
  }
}
