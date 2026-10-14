import { Command } from '@nestjs/cqrs';

import { UpdateSupportRoomRequestDto } from '#/modules/support/rooms/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '#/modules/support/rooms/update-support-room.response.dto';

export class UpdateSupportRoomCommand extends Command<UpdateSupportRoomResponseDto> {
  constructor(public readonly input: { roomId: string, dto: UpdateSupportRoomRequestDto }) { super(); }
}
