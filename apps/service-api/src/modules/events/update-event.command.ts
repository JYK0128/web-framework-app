import { Command } from '@nestjs/cqrs';

import type { UpdateEventRequestDto } from '#/modules/events/update-event.request.dto';
import { UpdateEventResponseDto } from '#/modules/events/update-event.response.dto';

export class UpdateEventCommand extends Command<UpdateEventResponseDto> {
  constructor(readonly eventId: string, readonly input: UpdateEventRequestDto) {
    super();
  }
}
