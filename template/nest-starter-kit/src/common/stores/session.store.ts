import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { differenceInDays, isAfter } from 'date-fns';
import { type AuthPrincipal, type Cookie, type SessionData, Store } from 'express-session';

import { PASSWORD_EXPIRATION_DAYS, SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { REQUIRED_TERM_GROUP_CODES } from '#/common/constants/terms.constants';
import { RequestContext } from '#/common/contexts/request.context';
import { getSessionCookieOptions } from '#/common/helpers/session-cookie.helper';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import type { Account } from '#/entities/auth/account.entity';
import { Session } from '#/entities/auth/session.entity';
import type { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class SessionStore extends Store implements OnApplicationBootstrap, OnModuleDestroy {
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  private static readonly CLEANUP_BATCH_SIZE = 1000;
  private cleanupTimer?: NodeJS.Timeout;
  private cleanupInFlight = false;
  private readonly logger = new Logger(SessionStore.name);

  constructor(
    private readonly entityManager: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {
    super();
  }

  onApplicationBootstrap(): void {
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredSessions();
    }, SessionStore.CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
    void this.cleanupExpiredSessions();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  override get(
    sessionId: string,
    callback: (error: unknown, session?: SessionData | null) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      const session = await em.findOne(
        Session,
        { token: sessionId },
        { populate: ['user', 'user.accounts'] },
      );
      if (!session || session.user.isBanned || session.user.isDeleted) return null;

      const expiresAt = session.expiresAt;
      if (expiresAt <= new Date()) {
        await em.nativeDelete(Session, { id: session.id });
        return null;
      }

      const [role, requiredTermsAgreed] = await Promise.all([
        session.user.role ? em.findOne(Role, { name: session.user.role }) : null,
        this.hasAgreedToRequiredTerms(em, session.user.id),
      ]);
      const principal = this.toPrincipal(
        session.user,
        role?.permissions ?? {},
        requiredTermsAgreed,
      );

      const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
      const cookie: Cookie = {
        ...getSessionCookieOptions(),
        originalMaxAge: SESSION_TTL_SECONDS * 1000,
        expires: expiresAt,
        maxAge,
      };
      return {
        cookie,
        user: principal,
      } satisfies SessionData;
    }).then(
      (session) => callback(null, session),
      (error) => callback(error),
    );
  }

  override set(
    sessionId: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      const userId = sessionData.user?.id;
      if (!userId) {
        await em.nativeDelete(Session, { token: sessionId });
        return;
      }

      const request = this.requestContext.request;
      await em.upsert(Session, {
        token: sessionId,
        user: userId,
        expiresAt: this.getExpiresAt(sessionData.cookie),
        ipAddress: request?.ip ?? null,
        userAgent: request?.get('user-agent')?.trim() || null,
      }, {
        onConflictFields: ['token'],
      });
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  override touch(
    sessionId: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.withEntityManager(async (em) => {
      await em.nativeUpdate(
        Session,
        { token: sessionId },
        { expiresAt: this.getExpiresAt(sessionData.cookie), updatedAt: new Date() },
      );
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  override destroy(sessionId: string, callback?: (error?: unknown) => void): void {
    void this.withEntityManager(async (em) => {
      await em.nativeDelete(Session, { token: sessionId });
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  async destroyAll(userId: string): Promise<void> {
    await this.withEntityManager(async (em) => {
      await em.nativeDelete(Session, { user: userId });
    });
  }

  async isActive(token: string, userId: string): Promise<boolean> {
    return await this.withEntityManager(async (em) => await em.count(Session, {
      token,
      user: userId,
      expiresAt: { $gt: new Date() },
    }) > 0);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    if (this.cleanupInFlight) return;
    this.cleanupInFlight = true;

    try {
      await this.withEntityManager(async (em) => {
        const sessions = await em.find(
          Session,
          { expiresAt: { $lte: new Date() } },
          { fields: ['id'], limit: SessionStore.CLEANUP_BATCH_SIZE },
        );
        if (sessions.length > 0) {
          await em.nativeDelete(Session, { id: { $in: sessions.map(({ id }) => id) } });
        }
      });
    }
    catch (error) {
      this.logger.error(
        `Failed to clean up expired sessions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    finally {
      this.cleanupInFlight = false;
    }
  }

  private getExpiresAt(cookie: Cookie): Date {
    return cookie.expires ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  }

  private toPrincipal(
    user: User,
    permissions: RolePermissions,
    requiredTermsAgreed: boolean,
  ): AuthPrincipal {
    const credentialAccount = user.accounts.getItems().find((account) => account.isPasswordAccount);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      role: user.role ?? null,
      permissions,
      requiredTermsAgreed,
      passwordUpdatedAt: credentialAccount?.metadata?.passwordUpdatedAt ?? null,
      isPasswordChangeRequired: this.isPasswordChangeRequired(user, credentialAccount),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    };
  }

  private isPasswordChangeRequired(user: User, credentialAccount?: Account): boolean {
    if (!credentialAccount) return false;
    if (credentialAccount.metadata?.passwordResetRequired) return true;
    const deferredUntil = credentialAccount.metadata?.passwordChangeDeferredUntil;
    if (deferredUntil && isAfter(deferredUntil, new Date())) return false;
    const baseDate = credentialAccount.metadata?.passwordUpdatedAt ?? user.createdAt;
    return differenceInDays(new Date(), baseDate) >= PASSWORD_EXPIRATION_DAYS;
  }

  private async hasAgreedToRequiredTerms(em: AppEntityManager, userId: string): Promise<boolean> {
    const terms = await em.find(
      Term,
      {
        termGroup: { isRequired: true },
        publishedAt: { $ne: null, $lte: new Date() },
      },
      {
        populate: ['termGroup'],
        orderBy: { publishedAt: 'DESC', id: 'DESC' },
      },
    );
    const latestRequiredTerms = new Map<string, Term>();
    for (const term of terms) {
      if (!latestRequiredTerms.has(term.termGroup.id)) {
        latestRequiredTerms.set(term.termGroup.id, term);
      }
    }
    const configuredCodes = new Set(
      [...latestRequiredTerms.values()].map((term) => term.termGroup.code),
    );
    const missingCodes = REQUIRED_TERM_GROUP_CODES.filter((code) => !configuredCodes.has(code));
    if (missingCodes.length > 0) {
      throw new Error(`Required terms are not configured: ${missingCodes.join(', ')}`);
    }

    const agreements = await em.find(
      UserTermAgreement,
      { user: userId },
      {
        populate: ['term', 'term.termGroup'],
        orderBy: { createdAt: 'DESC', id: 'DESC' },
      },
    );
    const latestAgreements = new Map<string, UserTermAgreement>();
    for (const agreement of agreements) {
      if (!latestAgreements.has(agreement.term.termGroup.id)) {
        latestAgreements.set(agreement.term.termGroup.id, agreement);
      }
    }

    return [...latestRequiredTerms].every(([termGroupId, term]) => {
      const agreement = latestAgreements.get(termGroupId);
      return agreement?.term.id === term.id && agreement.isAgreed;
    });
  }

  private async withEntityManager<T>(callback: (em: AppEntityManager) => Promise<T>): Promise<T> {
    const em = this.entityManager.fork();
    const result = await callback(em);
    await em.flush();
    return result;
  }
}
