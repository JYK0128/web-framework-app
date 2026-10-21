import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { GetLogStatsQuery } from '~/modules/log/get-log-stats.query';
import { GetLogStatsRequestDto } from '~/modules/log/get-log-stats.request.dto';
import { GetLogStatsResponseDto } from '~/modules/log/get-log-stats.response.dto';
import { GetLogsQuery } from '~/modules/log/get-logs.query';
import { GetLogsRequestDto } from '~/modules/log/get-logs.request.dto';
import { GetLogsResponseDto } from '~/modules/log/get-logs.response.dto';

@ApiTags('logs')
@UserAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(AdminPermission.log.read)
  @SwaggerApiResponse(GetLogsResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 조회' })
  getLogs(@Query() input: GetLogsRequestDto): Promise<GetLogsResponseDto> {
    return this.queryBus.execute(new GetLogsQuery(input));
  }

  @Get('stats')
  @Permissions(AdminPermission.log.read)
  @SwaggerApiResponse(GetLogStatsResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 통계' })
  getStats(): Promise<GetLogStatsResponseDto> {
    return this.queryBus.execute(new GetLogStatsQuery(new GetLogStatsRequestDto()));
  }
}
