import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { differenceInDays, isAfter } from 'date-fns';
import { type AuthPrincipal, type Cookie, type SessionData, Store } from 'express-session';

import { PASSWORD_EXPIRATION_DAYS, SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { RequestContext as AppRequestContext } from '#/common/contexts/request.context';
import { getSessionCookieOptions } from '#/common/helpers/session-cookie.helper';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import type { Account } from '#/entities/auth/account.entity';
import { Session } from '#/entities/auth/session.entity';
import type { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
export class SessionStore extends Store {
  constructor(
    private readonly entityManager: AppEntityManager,
    private readonly requestContext: AppRequestContext,
    private readonly systemConfigService: SystemConfigService,
  ) {
    super();
  }

  override get(
    sessionId: string,
    callback: (error: unknown, session?: SessionData | null) => void,
  ): void {
    void RequestContext.create(this.entityManager, async () => {
      const session = await this.entityManager.findOne(
        Session,
        { token: sessionId },
        { populate: ['user', 'user.accounts'] },
      );
      if (!session || session.user.isBanned || session.user.isDeleted) return null;

      const expiresAt = session.expiresAt;
      if (expiresAt <= new Date()) {
        await this.entityManager.nativeDelete(Session, { id: session.id });
        return null;
      }

      const [role, requiredTermsAgreed, authPolicy] = await Promise.all([
        session.user.role ? this.entityManager.findOne(Role, { name: session.user.role }) : null,
        this.hasAgreedToRequiredTerms(this.entityManager, session.user.id),
        this.systemConfigService.getAuthPolicy(),
      ]);
      const principal = this.toPrincipal(
        session.user,
        role?.permissions ?? {},
        requiredTermsAgreed,
        authPolicy.passwordExpirationDays,
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
    void RequestContext.create(this.entityManager, async () => {
      const userId = sessionData.user?.id;
      if (!userId) {
        await this.entityManager.nativeDelete(Session, { token: sessionId });
        return;
      }

      const request = this.requestContext.request;
      await this.entityManager.upsert(Session, {
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
    void RequestContext.create(this.entityManager, async () => {
      await this.entityManager.nativeUpdate(
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
    void RequestContext.create(this.entityManager, async () => {
      await this.entityManager.nativeDelete(Session, { token: sessionId });
    }).then(
      () => callback?.(),
      (error) => callback?.(error),
    );
  }

  destroyAll(userId: string): Promise<void> {
    return RequestContext.create(this.entityManager, async () => {
      await this.entityManager.nativeDelete(Session, { user: userId });
    });
  }

  destroyOthers(userId: string, currentSessionId: string): Promise<void> {
    return RequestContext.create(this.entityManager, async () => {
      await this.entityManager.nativeDelete(Session, {
        user: userId,
        token: { $ne: currentSessionId },
      });
    });
  }

  isActive(token: string, userId: string): Promise<boolean> {
    return RequestContext.create(this.entityManager, async () => {
      const count = await this.entityManager.count(Session, {
        token,
        user: userId,
        expiresAt: { $gt: new Date() },
      });
      return count > 0;
    });
  }

  private getExpiresAt(cookie: Cookie): Date {
    return cookie.expires ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  }

  private toPrincipal(
    user: User,
    permissions: RolePermissions,
    requiredTermsAgreed: boolean,
    passwordExpirationDays?: number,
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
      isPasswordChangeRequired: this.isPasswordChangeRequired(user, credentialAccount, passwordExpirationDays),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    };
  }

  private isPasswordChangeRequired(
    user: User,
    credentialAccount?: Account,
    expirationDays = PASSWORD_EXPIRATION_DAYS,
  ): boolean {
    if (!credentialAccount) return false;
    if (credentialAccount.metadata?.passwordResetRequired) return true;
    const deferredUntil = credentialAccount.metadata?.passwordChangeDeferredUntil;
    if (deferredUntil && isAfter(deferredUntil, new Date())) return false;
    if (expirationDays <= 0) return false;
    const baseDate = credentialAccount.metadata?.passwordUpdatedAt ?? user.createdAt;
    return differenceInDays(new Date(), baseDate) >= expirationDays;
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
    if (latestRequiredTerms.size === 0) {
      return true;
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
}
