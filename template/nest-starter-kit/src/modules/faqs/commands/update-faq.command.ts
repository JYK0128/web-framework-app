import { Command } from '@nestjs/cqrs';

import type { UpdateFaqRequestDto, UpdateFaqResponseDto } from '#/modules/faqs/dto';

export interface UpdateFaqPayload {
  faqId: string
  input: UpdateFaqRequestDto
}

export class UpdateFaqCommand extends Command<UpdateFaqResponseDto> {
  constructor(public readonly input: UpdateFaqPayload) {
    super();
  }
}
