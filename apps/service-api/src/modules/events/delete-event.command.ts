import { Command } from '@nestjs/cqrs';

import type { DeleteEventRequestDto } from '#/modules/events/delete-event.request.dto';
import { DeleteEventResponseDto } from '#/modules/events/delete-event.response.dto';

export class DeleteEventCommand extends Command<DeleteEventResponseDto> {
  constructor(readonly input: DeleteEventRequestDto) {
    super();
  }
}
