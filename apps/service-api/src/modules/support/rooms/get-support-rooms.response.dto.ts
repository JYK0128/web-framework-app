import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { SupportRoomItemDto } from '#/modules/support/rooms/support-room-item.dto';

export class GetSupportRoomsResponseDto extends PageResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] })
  @Type(() => SupportRoomItemDto)
  override items!: SupportRoomItemDto[];
}
