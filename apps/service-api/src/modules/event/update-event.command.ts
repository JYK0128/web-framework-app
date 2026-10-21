import { Command } from '@nestjs/cqrs';

import type { UpdateEventRequestDto } from '~/modules/event/update-event.request.dto';
import { UpdateEventResponseDto } from '~/modules/event/update-event.response.dto';

export class UpdateEventCommand extends Command<UpdateEventResponseDto> {
  constructor(readonly eventId: string, readonly input: UpdateEventRequestDto) {
    super();
  }
}
