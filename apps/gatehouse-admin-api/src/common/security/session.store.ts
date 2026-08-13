import { EntityManager, raw, wrap } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { type Cookie, type SessionData, Store } from 'express-session';
import { ClsService } from 'nestjs-cls';

import { IMPERSONATION_SESSION_TTL_SECONDS, SESSION_ROLLING_THRESHOLD_SECONDS, SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { getCookieOptions } from '#/common/security/cookie.config';
import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { Session as AuthSession } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';

@Injectable()
export class SessionStore extends Store implements OnModuleInit, OnModuleDestroy {
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  private static readonly CLEANUP_BATCH_SIZE = 1000;
  private cleanupTimer?: NodeJS.Timeout;
  private cleanupInFlight = false;

  constructor(
    @Inject(EntityManager) private readonly entityManager: EntityManager,
    private readonly cls: ClsService,
  ) {
    super();
  }

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredSessions();
    }, SessionStore.CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
    void this.cleanupExpiredSessions();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async ensureGuestSession(sid: string): Promise<void> {
    await this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      if (authSession) {
        if (
          !authSession.isExpired
          && !authSession.user?.isBanned
        ) {
          this.setCurrentUser(authSession.user);
          return;
        }
        await em.nativeDelete(AuthSession, { id: authSession.id });
      }

      const session = await this.upsertGuestSession(em, sid);

      this.setCurrentUser(session.user);
    });
  }

  private async cleanupExpiredSessions(): Promise<void> {
    if (this.cleanupInFlight) return;
    this.cleanupInFlight = true;

    try {
      const em = this.entityManager.fork();
      const expiredSessions = await em.find(
        AuthSession,
        { expiresAt: { $lt: new Date() } },
        { limit: SessionStore.CLEANUP_BATCH_SIZE },
      );

      if (expiredSessions.length > 0) {
        await em.nativeDelete(AuthSession, {
          id: { $in: expiredSessions.map((session) => session.id) },
        });
      }
    }
    finally {
      this.cleanupInFlight = false;
    }
  }

  async saveAuthenticatedSession(sid: string, userId: string, expiresAt: Date | null): Promise<void> {
    await this.withEntityManager(async (em) => {
      const user = await em.findOneOrFail(User, { id: userId });
      if (user.isBanned) {
        throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
      }
      let authSession = await em.findOne(AuthSession, { token: sid });

      if (authSession) {
        this.updateAuthSession(em, authSession, { user, expiresAt, impersonatedBy: null });
      }
      else {
        authSession = this.createAuthSession(em, sid, user, { expiresAt });
        em.persist(authSession);
      }

      this.setCurrentUser(user);
    });
  }

  async startImpersonation(
    sid: string,
    targetUserId: string,
    impersonatorId: string,
  ): Promise<{ user: User, expiresAt: Date }> {
    return this.withEntityManager(async (em) => {
      const session = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });
      if (!session || session.user?.id !== impersonatorId || session.impersonatedBy) {
        throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
      }

      const [impersonator, targetUser] = await Promise.all([
        em.findOneOrFail(User, { id: impersonatorId }, { filters: false }),
        em.findOne(User, { id: targetUserId }, { filters: false }),
      ]);

      if (!targetUser) {
        throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
      }
      if (targetUser.id === impersonator.id || targetUser.isBanned) {
        throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
      }
      if (
        isOneOfRoles(targetUser.role, ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN)
        && !isOneOfRoles(impersonator.role, ROLE_NAMES.SUPER_ADMIN)
      ) {
        throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.FORBIDDEN });
      }

      const expiresAt = new Date(Date.now() + IMPERSONATION_SESSION_TTL_SECONDS * 1000);
      this.updateAuthSession(em, session, {
        user: targetUser,
        expiresAt,
        impersonatedBy: impersonator.id,
      });
      this.setCurrentUser(targetUser);

      return { user: targetUser, expiresAt };
    });
  }

  async stopImpersonation(sid: string): Promise<{ user: User, expiresAt: Date | null }> {
    return this.withEntityManager(async (em) => {
      const session = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });
      if (!session?.impersonatedBy) {
        throw new ApplicationError({ code: 'IMPERSONATION_NOT_ACTIVE', status: HttpStatus.BAD_REQUEST });
      }

      const user = await em.findOneOrFail(User, { id: session.impersonatedBy }, { filters: false });
      if (user.isBanned) {
        await em.nativeDelete(AuthSession, { id: session.id });
        throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
      }

      const expiresAt = this.getExpiresAt();
      this.updateAuthSession(em, session, { user, expiresAt, impersonatedBy: null });
      this.setCurrentUser(user);

      return { user, expiresAt };
    });
  }

  override get(sid: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.withEntityManager(async (em) => {
      const authSession = await em.findOne(AuthSession, { token: sid }, { populate: ['user'] });

      if (!authSession) return null;

      if (authSession.isExpired) {
        await em.nativeDelete(AuthSession, { id: authSession.id });
        return null;
      }

      if (authSession.user?.isBanned) {
        await em.nativeDelete(AuthSession, { id: authSession.id });
        return null;
      }

      const oauthState = authSession.metadata?.oauthState;

      if (this.cls.isActive()) {
        this.setCurrentUser(authSession.user);
        this.cls.set(
          'oauthState',
          oauthState ?? null,
        );
      }

      const cookie: Cookie = {
        ...getCookieOptions(),
        originalMaxAge: authSession.expiresAt && SESSION_TTL_SECONDS > 0 ? SESSION_TTL_SECONDS * 1000 : null,
        expires: (authSession.expiresAt && SESSION_TTL_SECONDS > 0) ? authSession.expiresAt : null,
        ...(authSession.expiresAt && SESSION_TTL_SECONDS > 0
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
        if (authSession.user?.isBanned) {
          await em.nativeDelete(AuthSession, { id: authSession.id });
          const session = await this.upsertGuestSession(em, sid, { expiresAt, metadata });
          this.setCurrentUser(session.user);
          return;
        }
        this.updateAuthSession(em, authSession, { expiresAt, metadata });
        this.setCurrentUser(authSession.user);
        return;
      }

      const session = await this.upsertGuestSession(em, sid, { expiresAt, metadata });

      this.setCurrentUser(session.user);
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  override destroy(sid: string, callback?: (error?: unknown) => void): void {
    // request.session.regenerate()도 기존 session.token을 이 경로로 삭제한다.
    // 게스트 데이터 이전이 필요하면 삭제 전에 establishSession()에서 sid를 사용해야 한다.
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
      const thresholdMs = SESSION_ROLLING_THRESHOLD_SECONDS * 1000;
      if (remainingTime > thresholdMs) return;

      authSession.expiresAt = this.getExpiresAt(sessionData.cookie);
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  private getExpiresAt(cookie?: Cookie): Date | null {
    if (SESSION_TTL_SECONDS === -1) {
      return null;
    }
    if (cookie?.expires) {
      return cookie.expires;
    }
    return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  }

  private setCurrentUser(user: User | null): void {
    if (!this.cls.isActive()) return;

    this.cls.set('user', user ? wrap(user).toPOJO() : null);
  }

  private async upsertGuestSession(
    em: EntityManager,
    sid: string,
    data: { expiresAt?: Date | null, metadata?: Record<string, unknown> } = {},
  ): Promise<AuthSession> {
    const clientContext = this.cls.get('clientContext');

    await em.upsert(AuthSession, {
      token: sid,
      user: null,
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
    data: { expiresAt?: Date | null, metadata?: Record<string, unknown>, impersonatedBy?: string | null } = {},
  ): AuthSession {
    const clientContext = this.cls.get('clientContext');

    return em.create(AuthSession, {
      token: sid,
      user,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : this.getExpiresAt(),
      impersonatedBy: data.impersonatedBy ?? null,
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
    data: {
      expiresAt?: Date | null
      metadata?: Record<string, unknown>
      user?: User | null
      impersonatedBy?: string | null
    },
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

function isOneOfRoles(role: unknown, ...expectedRoles: string[]): boolean {
  return typeof role === 'string' && expectedRoles.includes(role);
}
