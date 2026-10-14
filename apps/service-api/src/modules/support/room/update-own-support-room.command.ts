import { Command } from '@nestjs/cqrs';

import { UpdateSupportRoomRequestDto } from '#/modules/support/room/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '#/modules/support/room/update-support-room.response.dto';

export class UpdateOwnSupportRoomCommand extends Command<UpdateSupportRoomResponseDto> {
  constructor(public readonly input: { roomId: string, dto: UpdateSupportRoomRequestDto }) { super(); }
}
