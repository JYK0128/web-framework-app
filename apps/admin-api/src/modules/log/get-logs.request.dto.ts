import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import type { LogEntry } from '@pkg/server-core/log-telemetry/log-telemetry.interface';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetLogsRequestDto extends PageRequestDto<LogEntry, 'createdAt' | 'level' | 'method' | 'url' | 'statusCode' | 'duration' | 'requestId'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'level', 'method', 'url', 'statusCode', 'duration', 'requestId'] })
  @IsIn(['createdAt', 'level', 'method', 'url', 'statusCode', 'duration', 'requestId'], { each: true })
  override sort: ('createdAt' | 'level' | 'method' | 'url' | 'statusCode' | 'duration' | 'requestId')[] = ['createdAt'];

  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional({ enum: ['error', 'success'] }) @IsOptional() @IsIn(['error', 'success']) status?: 'error' | 'success';
}
