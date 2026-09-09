import { QueryOrder } from '@mikro-orm/core';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ALERT_LIST_DEFAULT_LIMIT } from '#/common/configs/application.config';
import { SessionContext } from '#/common/contexts/session.context';
import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AlertFeedResponseDto } from '#/modules/alerts/dto/alert-feed-response.dto';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { GetMyAlertsQuery } from '#/modules/alerts/queries/get-my-alerts.query';

@QueryHandler(GetMyAlertsQuery)
export class GetMyAlertsHandler implements IQueryHandler<GetMyAlertsQuery, AlertFeedResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetMyAlertsQuery): Promise<AlertFeedResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    return this.process(input);
  }

  private identify(query: GetMyAlertsQuery): GetMyAlertsQuery['input'] {
    return query.input;
  }

  private verify(input: GetMyAlertsQuery['input']): void {
    if (input.limit < 1 || input.limit > 100) {
      throw new Error('알림 조회 건수는 1에서 100 사이여야 합니다.');
    }
  }

  private async process(input: GetMyAlertsQuery['input']): Promise<AlertFeedResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const [alerts, total] = await this.em.findAndCount(
      Alert,
      { user: userId },
      {
        orderBy: { createdAt: QueryOrder.DESC },
        limit: input.limit ?? ALERT_LIST_DEFAULT_LIMIT,
      },
    );

    const unreadCount = await this.em.count(Alert, {
      user: userId,
      isRead: false,
    });

    const items = alerts.map((a) => new AlertItemDto(a));
    return new AlertFeedResponseDto(items, total, unreadCount);
  }
}
