import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { SupportRoomItemDto } from '#/modules/support/room/support-room-item.dto';

export class GetSupportRoomPiiListResponseDto extends PageResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] })
  @Type(() => SupportRoomItemDto)
  override items!: SupportRoomItemDto[];
}
