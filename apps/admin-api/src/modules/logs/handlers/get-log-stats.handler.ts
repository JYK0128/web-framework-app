import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogStatsResponseDto } from '#/modules/logs/dto/log-stats.response.dto';
import { LogsService } from '#/modules/logs/logs.service';
import { GetLogStatsQuery } from '#/modules/logs/queries/get-log-stats.query';

@Injectable()
@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, LogStatsResponseDto> {
  constructor(private readonly logs: LogsService) {}
  async execute(): Promise<LogStatsResponseDto> {
    return LogStatsResponseDto.fromPlain(await this.logs.stats());
  }
}
