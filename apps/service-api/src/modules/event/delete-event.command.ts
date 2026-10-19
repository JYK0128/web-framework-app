import { Command } from '@nestjs/cqrs';

import type { DeleteEventRequestDto } from '#/modules/event/delete-event.request.dto';
import { DeleteEventResponseDto } from '#/modules/event/delete-event.response.dto';

export class DeleteEventCommand extends Command<DeleteEventResponseDto> {
  constructor(readonly input: DeleteEventRequestDto) {
    super();
  }
}
