import { PartialType } from '@nestjs/swagger';

import { CreateEventRequestDto } from '#/modules/event/create-event.request.dto';

export class UpdateEventRequestDto extends PartialType(CreateEventRequestDto, { skipNullProperties: false }) {
  static readonly richTextFields = ['content'];
}
