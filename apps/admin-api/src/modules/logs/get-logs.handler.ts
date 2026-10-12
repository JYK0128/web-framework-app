import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetLogsQuery } from '#/modules/logs/get-logs.query';
import { LogPageResponseDto } from '#/modules/logs/log-page.response.dto';
import { LogsService } from '#/modules/logs/logs.service';

@Injectable()
@QueryHandler(GetLogsQuery)
export class GetLogsHandler implements IQueryHandler<GetLogsQuery, LogPageResponseDto> {
  constructor(private readonly logs: LogsService) {}
  async execute({ input }: GetLogsQuery): Promise<LogPageResponseDto> {
    return LogPageResponseDto.parse(await this.logs.list(input));
  }
}
