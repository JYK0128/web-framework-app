import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto/response/cursor.response.dto';
import { Type } from 'class-transformer';

import { NoticeItemDto } from '#/modules/notice/notice-item.dto';

export class GetPublicNoticesResponseDto extends CursorResponseDto<NoticeItemDto> {
  @ApiProperty({ type: [NoticeItemDto] })
  @Type(() => NoticeItemDto)
  items!: NoticeItemDto[];
}
