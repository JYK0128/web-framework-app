import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityLogsQuery } from '#/modules/activity-logs/queries';
import { LokiLogReaderService } from '#/modules/activity-logs/services/loki-log-reader.service';

@QueryHandler(GetActivityLogsQuery)
export class GetActivityLogsHandler implements IQueryHandler<GetActivityLogsQuery, GetActivityLogsResponseDto> {
  constructor(private readonly lokiReader: LokiLogReaderService) {}

  async execute(query: GetActivityLogsQuery): Promise<GetActivityLogsResponseDto> {
    return this.lokiReader.getLogs(query.query);
  }
}
