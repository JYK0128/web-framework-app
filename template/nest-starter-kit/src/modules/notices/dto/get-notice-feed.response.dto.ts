import { ApiProperty } from '@nestjs/swagger';

import { CursorResponseDto } from '#/common/interfaces';

import { NoticeFeedItemDto } from './notice-feed-item.dto';

export class GetNoticeFeedResponseDto extends CursorResponseDto<NoticeFeedItemDto> {
  @ApiProperty({ type: () => [NoticeFeedItemDto] })
  override items!: NoticeFeedItemDto[];
}
