import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetLogsRequestDto } from './dto/get-logs.request.dto';
import { GetLogStatsRequestDto } from './dto/get-log-stats.request.dto';
import { LogPageResponseDto } from './dto/log-page.response.dto';
import { LogStatsResponseDto } from './dto/log-stats.response.dto';
import { GetLogsQuery } from './queries/get-logs.query';
import { GetLogStatsQuery } from './queries/get-log-stats.query';

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
