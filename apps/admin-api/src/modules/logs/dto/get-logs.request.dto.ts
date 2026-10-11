import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import type { LogEntry } from '#/core/database/entities/logs/log-entry.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetLogsRequestDto extends PageRequestDto<LogEntry, 'createdAt' | 'level' | 'method' | 'path' | 'statusCode' | 'durationMs' | 'requestId'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'level', 'method', 'path', 'statusCode', 'durationMs', 'requestId'] })
  @IsIn(['createdAt', 'level', 'method', 'path', 'statusCode', 'durationMs', 'requestId'], { each: true })
  override sort: ('createdAt' | 'level' | 'method' | 'path' | 'statusCode' | 'durationMs' | 'requestId')[] = ['createdAt'];

  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional({ enum: ['error', 'success'] }) @IsOptional() @IsIn(['error', 'success']) status?: 'error' | 'success';
}
