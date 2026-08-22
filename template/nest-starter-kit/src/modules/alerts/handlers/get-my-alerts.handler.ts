import { QueryOrder } from '@mikro-orm/core';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AlertFeedResponseDto } from '#/modules/alerts/dto/alert-feed-response.dto';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { GetMyAlertsQuery } from '#/modules/alerts/queries/get-my-alerts.query';

@QueryHandler(GetMyAlertsQuery)
export class GetMyAlertsHandler implements IQueryHandler<GetMyAlertsQuery, AlertFeedResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetMyAlertsQuery): Promise<AlertFeedResponseDto> {
    const [alerts, total] = await this.em.findAndCount(
      Alert,
      { user: query.input.userId },
      {
        orderBy: { createdAt: QueryOrder.DESC },
        limit: query.input.limit ?? 50,
      },
    );

    const unreadCount = await this.em.count(Alert, {
      user: query.input.userId,
      isRead: false,
    });

    const items = alerts.map((a) => new AlertItemDto(a));
    return new AlertFeedResponseDto(items, total, unreadCount);
  }
}
