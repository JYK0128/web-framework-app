import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LokiService } from '#/common/services/loki/loki.service';
import { type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityLogsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityLogsQuery)
export class GetActivityLogsHandler implements IQueryHandler<GetActivityLogsQuery, GetActivityLogsResponseDto> {
  constructor(private readonly lokiService: LokiService) {}

  async execute(query: GetActivityLogsQuery): Promise<GetActivityLogsResponseDto> {
    return this.lokiService.getLogs(query.query);
  }
}
