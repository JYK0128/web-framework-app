import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { NoticeItemDto } from './notice-item.dto';

export class GetAdminNoticesResponseDto extends PageResponseDto<NoticeItemDto> {
  @ApiProperty({ type: () => [NoticeItemDto] })
  @Type(() => NoticeItemDto)
  override items!: NoticeItemDto[];
}
