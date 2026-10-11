import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { LogItemDto } from '#/modules/logs/dto/log-item.dto';

export class LogPageResponseDto extends PageResponseDto<LogItemDto> {
  @ApiProperty({ type: [LogItemDto] }) @Type(() => LogItemDto) override items!: LogItemDto[];
}
