import { ApiProperty } from '@nestjs/swagger';

import { CursorResponseDto } from '#/common/interfaces';

import { LogItemDto } from './log-item.dto';

export class GetLogsResponseDto extends CursorResponseDto<LogItemDto> {
  @ApiProperty({ type: () => [LogItemDto] })
  override items!: LogItemDto[];
}
