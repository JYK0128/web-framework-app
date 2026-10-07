import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import type { LogEntry } from '#/entities/logs/log-entry.entity';

export class GetLogsRequestDto extends PageRequestDto<LogEntry> {
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional({ enum: ['error', 'success'] }) @IsOptional() @IsIn(['error', 'success']) status?: string;
}
