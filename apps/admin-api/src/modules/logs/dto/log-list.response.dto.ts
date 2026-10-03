import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { LogItemDto } from './log-item.dto';

export class LogListResponseDto extends PageResponseDto<LogItemDto> {
  @ApiProperty({ type: [LogItemDto] }) @Type(() => LogItemDto) override items!: LogItemDto[];
}
