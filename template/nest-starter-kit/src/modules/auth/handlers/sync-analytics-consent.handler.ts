import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, toBoolean } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { RequestContext } from '#/common/contexts/request.context';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SyncAnalyticsConsentCommand } from '#/modules/auth/commands/sync-analytics-consent.command';
import { SyncAnalyticsConsentResponseDto } from '#/modules/auth/dto/sync-analytics-consent.response.dto';

@Injectable()
@CommandHandler(SyncAnalyticsConsentCommand)
export class SyncAnalyticsConsentHandler implements ICommandHandler<SyncAnalyticsConsentCommand, SyncAnalyticsConsentResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_command: SyncAnalyticsConsentCommand): Promise<SyncAnalyticsConsentResponseDto> {
    const user = await this.identifyUser();
    return this.process(user);
  }

  private async identifyUser(): Promise<User> {
    const userId = this.requestContext.request?.session.user?.id;
    if (!userId) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return this.em.findOneOrFail(User, { id: userId });
  }

  private async process(user: User): Promise<SyncAnalyticsConsentResponseDto> {
    const incomingCookie = (this.requestContext.request?.cookies as Record<string, string> | undefined)?.analytics_consent;
    const consent = toBoolean(incomingCookie);

    // 1. If incoming cookie is explicitly truthy (1, true, granted)
    if (consent === true) {
      user.metadata = {
        ...(user.metadata ?? {}),
        analyticsAgreedAt: user.metadata?.analyticsAgreedAt ?? new Date(),
      };
    }
    // 2. If incoming cookie is explicitly falsy (0, false, denied)
    else if (consent === false) {
      user.metadata = {
        ...(user.metadata ?? {}),
        analyticsAgreedAt: null,
      };
    }
    // 3. If no incoming cookie (null) -> preserve existing DB state

    const res = (this.requestContext.request as (Request & { res?: Response }) | null)?.res;
    if (res) {
      res.cookie('analytics_consent', user.isAnalyticsAgreed ? '1' : '0', {
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    return { ok: true };
  }
}
