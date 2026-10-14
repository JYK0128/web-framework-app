import { Command } from '@nestjs/cqrs';

import { CreateSupportRoomRequestDto } from '#/modules/support/room/create-support-room.request.dto';
import { CreateSupportRoomResponseDto } from '#/modules/support/room/create-support-room.response.dto';

export class CreateSupportRoomCommand extends Command<CreateSupportRoomResponseDto> {
  constructor(public readonly input: CreateSupportRoomRequestDto) { super(); }
}
