import { QueryOrder } from '@mikro-orm/core';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ALERT_LIST_DEFAULT_LIMIT } from '#/common/configs/application.config';
import { SessionContext } from '#/common/contexts/session.context';
import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { GetMyAlertsResponseDto } from '#/modules/alerts/dto/get-my-alerts.response.dto';
import { GetMyAlertsQuery } from '#/modules/alerts/queries/get-my-alerts.query';

@QueryHandler(GetMyAlertsQuery)
export class GetMyAlertsHandler implements IQueryHandler<GetMyAlertsQuery, GetMyAlertsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetMyAlertsQuery): Promise<GetMyAlertsResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    return this.process(input);
  }

  private identify(query: GetMyAlertsQuery): GetMyAlertsQuery['input']['query'] {
    return query.input.query;
  }

  private verify(input: GetMyAlertsQuery['input']['query']): void {
    if (input.limit < 1 || input.limit > 100) {
      throw new Error('알림 조회 건수는 1에서 100 사이여야 합니다.');
    }
  }

  private async process(input: GetMyAlertsQuery['input']['query']): Promise<GetMyAlertsResponseDto> {
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

    const items = AlertItemDto.fromPlainArray(alerts);
    return GetMyAlertsResponseDto.fromPlain({ items, total, unreadCount });
  }
}
