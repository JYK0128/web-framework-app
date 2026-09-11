import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { NoticeItemDto } from './notice-item.dto';

export class GetNoticesResponseDto extends ListResponseDto<NoticeItemDto> {
  @ApiProperty({ type: () => [NoticeItemDto] })
  @Type(() => NoticeItemDto)
  override items!: NoticeItemDto[];
}
