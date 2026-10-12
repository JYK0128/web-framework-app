import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetLogStatsQuery } from '#/modules/logs/get-log-stats.query';
import { LogStatsResponseDto } from '#/modules/logs/log-stats.response.dto';
import { LogsService } from '#/modules/logs/logs.service';

@Injectable()
@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, LogStatsResponseDto> {
  constructor(private readonly logs: LogsService) {}
  async execute(): Promise<LogStatsResponseDto> {
    return LogStatsResponseDto.parse(await this.logs.stats());
  }
}
