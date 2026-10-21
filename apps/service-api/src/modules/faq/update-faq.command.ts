import { Command } from '@nestjs/cqrs';

import { type UpdateFaqRequestDto } from '~/modules/faq/update-faq.request.dto';
import { UpdateFaqResponseDto } from '~/modules/faq/update-faq.response.dto';

export class UpdateFaqCommand extends Command<UpdateFaqResponseDto> {
  constructor(public readonly input: { faqId: string, dto: UpdateFaqRequestDto }) {
    super();
  }
}
