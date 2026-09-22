import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { LogsService } from './logs.service';

class LogItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() level!: string;
  @ApiProperty() method!: string;
  @ApiProperty() path!: string;
  @ApiProperty() statusCode!: number;
  @ApiProperty() durationMs!: number;
  @ApiProperty({ nullable: true }) requestId!: string | null;
  @ApiProperty({ nullable: true }) ipAddress!: string | null;
  @ApiProperty({ nullable: true }) userAgent!: string | null;
  @ApiProperty({ nullable: true }) errorMessage!: string | null;
}
class LogListResponseDto {
  @ApiProperty({ type: [LogItemDto] }) items!: LogItemDto[];
  @ApiProperty() page!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPrevPage!: boolean;
  @ApiProperty() totalCount!: number;
}
class LogStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() errors!: number;
  @ApiProperty() averageDurationMs!: number;
  @ApiProperty() errorRate!: number;
}

@ApiTags('logs')
@UserAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @Get()
  @Permissions(Permission.log.read)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'status', required: false })
  @SwaggerApiResponse(LogListResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 조회' })
  getLogs(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string, @Query('method') method?: string, @Query('status') status?: string) {
    return this.service.list(Math.max(Number(page) || 1, 1), Math.min(Math.max(Number(limit) || 20, 1), 100), search, method, status);
  }

  @Get('stats')
  @Permissions(Permission.log.read)
  @SwaggerApiResponse(LogStatsDto)
  @ApiOperation({ summary: 'HTTP 로그 통계' })
  getStats() { return this.service.stats(); }
}
