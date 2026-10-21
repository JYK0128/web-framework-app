import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { NoticeItemDto } from '~/modules/notice/notice-item.dto';

export class GetNoticesResponseDto extends PageResponseDto<NoticeItemDto> {
  @ApiProperty({ type: [NoticeItemDto] })
  @Type(() => NoticeItemDto)
  items!: NoticeItemDto[];
}
