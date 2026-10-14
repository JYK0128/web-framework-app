import { Command } from '@nestjs/cqrs';

import { type UpdateFaqRequestDto } from '#/modules/faqs/update-faq.request.dto';
import { UpdateFaqResponseDto } from '#/modules/faqs/update-faq.response.dto';

export class UpdateFaqCommand extends Command<UpdateFaqResponseDto> {
  constructor(public readonly input: { faqId: string, dto: UpdateFaqRequestDto }) {
    super();
  }
}
