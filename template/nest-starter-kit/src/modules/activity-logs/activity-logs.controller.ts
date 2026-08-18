import { Controller, Get, type MessageEvent, Param, Query, Sse } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Observable } from 'rxjs';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { ActivityLogItemDto, ActivityStatsResponseDto, GetActivityLogsRequestDto, GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityLogByIdQuery, GetActivityLogsQuery, GetActivityStatsQuery } from '#/modules/activity-logs/queries';
import { LokiLogReaderService } from '#/modules/activity-logs/services/loki-log-reader.service';

@ApiTags('activity-logs')
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly lokiReader: LokiLogReaderService,
  ) {}

  @Permission('activityLog:manage', 'activityLog:read')
  @Get()
  @ApiOperation({ summary: '활동 로그 목록 조회 (LogQL / SSR)' })
  @SwaggerApiResponse(GetActivityLogsResponseDto)
  async getLogs(@Query() query: GetActivityLogsRequestDto): Promise<GetActivityLogsResponseDto> {
    return this.queryBus.execute(new GetActivityLogsQuery(query));
  }

  @Permission('activityLog:manage', 'activityLog:read')
  @Get('stats')
  @ApiOperation({ summary: '활동 로그 요약 통계 조회' })
  @SwaggerApiResponse(ActivityStatsResponseDto)
  async getStats(): Promise<ActivityStatsResponseDto> {
    return this.queryBus.execute(new GetActivityStatsQuery());
  }

  @Permission('activityLog:manage', 'activityLog:read')
  @Sse('stream')
  @ApiOperation({ summary: '실시간 활동 로그 스트리밍 (SSE)' })
  streamLogs(): Observable<MessageEvent> {
    return this.lokiReader.streamLogs();
  }

  @Permission('activityLog:manage', 'activityLog:read')
  @Get(':id')
  @ApiOperation({ summary: '활동 로그 단건 상세 조회' })
  @SwaggerApiResponse(ActivityLogItemDto)
  async getLogById(@Param('id') id: string): Promise<ActivityLogItemDto> {
    return this.queryBus.execute(new GetActivityLogByIdQuery(id));
  }
}
