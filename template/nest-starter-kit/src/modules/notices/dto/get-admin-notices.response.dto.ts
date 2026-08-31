import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { NoticeItemDto } from './notice-item.dto';

export class GetAdminNoticesResponseDto extends PageResponseDto<NoticeItemDto> {
  @ApiProperty({ type: () => [NoticeItemDto] })
  override items!: NoticeItemDto[];
}
