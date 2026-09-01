import { ApiProperty } from '@nestjs/swagger';

import { NoticeItemDto } from './notice-item.dto';

export class GetNoticesResponseDto {
  @ApiProperty({ type: () => [NoticeItemDto] })
  notices!: NoticeItemDto[];
}
