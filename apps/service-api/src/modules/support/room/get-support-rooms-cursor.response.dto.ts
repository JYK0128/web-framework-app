import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { SupportRoomItemDto } from '~/modules/support/room/support-room-item.dto';

export class GetSupportRoomsCursorResponseDto extends CursorResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] })
  @Type(() => SupportRoomItemDto)
  override items!: SupportRoomItemDto[];
}
