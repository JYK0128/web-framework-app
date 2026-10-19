import { Controller, Get, type MessageEvent, Param, Query, Sse } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { map, type Observable } from 'rxjs';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { LogTelemetryService } from '#/infra/log-telemetry';
import { RealtimeService } from '#/infra/realtime';
import { GetLogByIdResponseDto, GetLogsRequestDto, GetLogsResponseDto, GetLogStatsRequestDto, GetLogStatsResponseDto } from '#/modules/logs/dto';
import { GetLogByIdQuery, GetLogsQuery, GetLogStatsQuery } from '#/modules/logs/queries';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logTelemetryService: LogTelemetryService,
    private readonly realtime: RealtimeService,
  ) {}

  @Permission('log:manage', 'log:read')
  @Get()
  @ApiOperation({ summary: '로그 목록 조회 (LogQL / SSR)' })
  @SwaggerApiResponse(GetLogsResponseDto)
  async getLogs(@Query() query: GetLogsRequestDto): Promise<GetLogsResponseDto> {
    return this.queryBus.execute(new GetLogsQuery({ query }));
  }

  @Permission('log:manage', 'log:read')
  @Get('stats')
  @ApiOperation({ summary: '로그 요약 통계 조회' })
  @SwaggerApiResponse(GetLogStatsResponseDto)
  async getStats(@Query() query?: GetLogStatsRequestDto): Promise<GetLogStatsResponseDto> {
    return this.queryBus.execute(new GetLogStatsQuery({ query: query ?? new GetLogStatsRequestDto() }));
  }

  @Permission('log:manage', 'log:read')
  @Sse('stream')
  @ApiOperation({ summary: '실시간 로그 스트리밍 (SSE)' })
  streamLogs(): Observable<MessageEvent> {
    const source = this.logTelemetryService.watchLogs().pipe(
      map((log) => ({
        type: 'log',
        data: log,
      })),
    );

    return this.realtime.bridgeSSE('logs', source);
  }

  @Permission('log:manage', 'log:read')
  @Get(':id')
  @ApiOperation({ summary: '로그 단건 상세 조회' })
  @SwaggerApiResponse(GetLogByIdResponseDto)
  async getLogById(@Param('id') id: string): Promise<GetLogByIdResponseDto> {
    return this.queryBus.execute(new GetLogByIdQuery({ logId: id }));
  }
}
