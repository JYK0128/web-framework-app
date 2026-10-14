import { Command } from '@nestjs/cqrs';

import type { CreateEventRequestDto } from '#/modules/events/create-event.request.dto';
import { CreateEventResponseDto } from '#/modules/events/create-event.response.dto';

export class CreateEventCommand extends Command<CreateEventResponseDto> {
  constructor(readonly input: CreateEventRequestDto) {
    super();
  }
}
