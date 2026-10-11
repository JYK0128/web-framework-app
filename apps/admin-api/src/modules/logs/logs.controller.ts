import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { GetLogStatsRequestDto } from '#/modules/logs/dto/get-log-stats.request.dto';
import { GetLogsRequestDto } from '#/modules/logs/dto/get-logs.request.dto';
import { LogPageResponseDto } from '#/modules/logs/dto/log-page.response.dto';
import { LogStatsResponseDto } from '#/modules/logs/dto/log-stats.response.dto';

import { GetLogStatsQuery } from './queries/get-log-stats.query';
import { GetLogsQuery } from './queries/get-logs.query';

@ApiTags('logs')
@UserAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(AdminPermission.log.read)
  @SwaggerApiResponse(LogPageResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 조회' })
  getLogs(@Query() input: GetLogsRequestDto): Promise<LogPageResponseDto> {
    return this.queryBus.execute(new GetLogsQuery(input));
  }

  @Get('stats')
  @Permissions(AdminPermission.log.read)
  @SwaggerApiResponse(LogStatsResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 통계' })
  getStats(): Promise<LogStatsResponseDto> {
    return this.queryBus.execute(new GetLogStatsQuery(new GetLogStatsRequestDto()));
  }
}
