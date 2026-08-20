import { NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LokiService } from '#/common/services/loki/loki.service';
import { type ActivityLogItemDto } from '#/modules/activity-logs/dto';
import { GetActivityLogByIdQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityLogByIdQuery)
export class GetActivityLogByIdHandler implements IQueryHandler<GetActivityLogByIdQuery, ActivityLogItemDto> {
  constructor(private readonly lokiService: LokiService) {}

  async execute(query: GetActivityLogByIdQuery): Promise<ActivityLogItemDto> {
    const log = await this.lokiService.getLogById(query.input.id);
    if (!log) {
      throw new NotFoundException(`활동 로그를 찾을 수 없습니다. (ID: ${query.input.id})`);
    }
    return log;
  }
}
