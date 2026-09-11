import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces';

import { NoticeItemDto } from './notice-item.dto';

export class GetNoticeFeedResponseDto extends CursorResponseDto<NoticeItemDto> {
  @ApiProperty({ type: () => [NoticeItemDto] })
  @Type(() => NoticeItemDto)
  override items!: NoticeItemDto[];
}
