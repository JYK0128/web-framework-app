import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogStatsResponseDto } from '../dto/log-stats.response.dto';
import { LogsService } from '../logs.service';
import { GetLogStatsQuery } from '../queries/get-log-stats.query';

@Injectable()
@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, LogStatsResponseDto> {
  constructor(private readonly logs: LogsService) {}
  async execute(query: GetLogStatsQuery): Promise<LogStatsResponseDto> {
    void query.input;
    return LogStatsResponseDto.fromPlain(await this.logs.stats());
  }
}
