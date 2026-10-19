import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LogTelemetryService } from '@pkg/server-core/log-telemetry/log-telemetry.service';

import { GetLogsQuery } from '#/modules/log/get-logs.query';
import { GetLogsResponseDto } from '#/modules/log/get-logs.response.dto';
import { LogItemDto } from '#/modules/log/log-item.dto';

@Injectable()
@QueryHandler(GetLogsQuery)
export class GetLogsHandler implements IQueryHandler<GetLogsQuery, GetLogsResponseDto> {
  constructor(private readonly telemetry: LogTelemetryService) {}
  async execute({ input }: GetLogsQuery): Promise<GetLogsResponseDto> {
    const { search, method, status, page, limit } = input;
    const result = await this.telemetry.getLogs({
      search,
      method,
      status,
      limit,
      offset: (page - 1) * limit,
    });
    return GetLogsResponseDto.parse({
      items: LogItemDto.parseArray(result.items),
      page,
      totalPages: Math.ceil(result.totalCount / limit),
      hasNextPage: page * limit < result.totalCount,
      hasPrevPage: page > 1 && result.totalCount > 0,
      totalCount: result.totalCount,
    });
  }
}
