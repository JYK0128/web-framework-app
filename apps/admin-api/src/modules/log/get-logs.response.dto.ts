import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { LogItemDto } from '~/modules/log/log-item.dto';

export class GetLogsResponseDto extends PageResponseDto<LogItemDto> {
  @ApiProperty({ type: [LogItemDto] })
  @Type(() => LogItemDto)
  override items!: LogItemDto[];
}
