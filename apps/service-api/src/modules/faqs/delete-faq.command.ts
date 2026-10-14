import { Command } from '@nestjs/cqrs';

import type { DeleteFaqRequestDto } from '#/modules/faqs/delete-faq.request.dto';
import { DeleteFaqResponseDto } from '#/modules/faqs/delete-faq.response.dto';

export class DeleteFaqCommand extends Command<DeleteFaqResponseDto> {
  constructor(public readonly input: DeleteFaqRequestDto) {
    super();
  }
}
