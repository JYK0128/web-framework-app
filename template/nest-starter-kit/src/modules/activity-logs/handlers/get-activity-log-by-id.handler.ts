import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type ActivityLogItemDto } from '#/modules/activity-logs/dto';
import { GetActivityLogByIdQuery } from '#/modules/activity-logs/queries';
import { LokiLogReaderService } from '#/modules/activity-logs/services/loki-log-reader.service';

@QueryHandler(GetActivityLogByIdQuery)
export class GetActivityLogByIdHandler implements IQueryHandler<GetActivityLogByIdQuery, ActivityLogItemDto> {
  constructor(private readonly lokiReader: LokiLogReaderService) {}

  async execute(query: GetActivityLogByIdQuery): Promise<ActivityLogItemDto> {
    return this.lokiReader.getLogById(query.id);
  }
}
