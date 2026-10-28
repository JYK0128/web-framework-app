import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import type { LogEntry } from '@pkg/server-core/log-telemetry';
import { IsIn, IsOptional, IsString } from 'class-validator';

const GetLogsRequestDtoBase = QueryRequestDtoFor<LogEntry>()({
  search: { fields: [] },
  sort: { fields: ['createdAt', 'level', 'method', 'url', 'statusCode', 'duration', 'requestId'], default: ['createdAt'] },
  page: {},
});

export class GetLogsRequestDto extends GetLogsRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'level', 'method', 'url', 'statusCode', 'duration', 'requestId'] })
  @IsIn(['createdAt', 'level', 'method', 'url', 'statusCode', 'duration', 'requestId'], { each: true })
  override sort: ('createdAt' | 'level' | 'method' | 'url' | 'statusCode' | 'duration' | 'requestId')[] = ['createdAt'];

  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional({ enum: ['error', 'success'] }) @IsOptional() @IsIn(['error', 'success']) status?: 'error' | 'success';
}
