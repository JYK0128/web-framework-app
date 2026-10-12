import { PartialType } from '@nestjs/swagger';

import { CreateEventRequestDto } from '#/modules/events/create-event.request.dto';

export class UpdateEventRequestDto extends PartialType(CreateEventRequestDto) {
  static readonly richTextFields = ['content'];
}
