import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '#/config';

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
  @ApiQuery({ name: 'page', required: false, type: Number, default: PAGINATION_DEFAULT_PAGE })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: PAGINATION_DEFAULT_LIMIT, maximum: PAGINATION_MAX_LIMIT })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'status', required: false })
  @SwaggerApiResponse(LogListResponseDto)
  @ApiOperation({ summary: 'HTTP 로그 조회' })
  getLogs(@Query('page') page = PAGINATION_DEFAULT_PAGE, @Query('limit') limit = PAGINATION_DEFAULT_LIMIT, @Query('search') search?: string, @Query('method') method?: string, @Query('status') status?: string) {
    return this.service.list(Math.max(Number(page) || PAGINATION_DEFAULT_PAGE, 1), Math.min(Math.max(Number(limit) || PAGINATION_DEFAULT_LIMIT, 1), PAGINATION_MAX_LIMIT), search, method, status);
  }

  @Get('stats')
  @Permissions(Permission.log.read)
  @SwaggerApiResponse(LogStatsDto)
  @ApiOperation({ summary: 'HTTP 로그 통계' })
  getStats() { return this.service.stats(); }
}
