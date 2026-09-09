import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { NoticeItemDto } from './notice-item.dto';

export class GetNoticesResponseDto extends ListResponseDto<NoticeItemDto> {
  @ApiProperty({ type: () => [NoticeItemDto] })
  override items!: NoticeItemDto[];
}
