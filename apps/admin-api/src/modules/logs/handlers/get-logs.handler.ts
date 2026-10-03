import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogPageResponseDto } from '#/modules/logs/dto/log-page.response.dto';
import { LogsService } from '#/modules/logs/logs.service';
import { GetLogsQuery } from '#/modules/logs/queries/get-logs.query';

@Injectable()
@QueryHandler(GetLogsQuery)
export class GetLogsHandler implements IQueryHandler<GetLogsQuery, LogPageResponseDto> {
  constructor(private readonly logs: LogsService) {}
  async execute({ input }: GetLogsQuery): Promise<LogPageResponseDto> {
    return LogPageResponseDto.fromPlain(await this.logs.list(input.page, input.limit, input.search, input.method, input.status));
  }
}
