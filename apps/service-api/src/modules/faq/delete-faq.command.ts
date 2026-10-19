import { Command } from '@nestjs/cqrs';

import type { DeleteFaqRequestDto } from '#/modules/faq/delete-faq.request.dto';
import { DeleteFaqResponseDto } from '#/modules/faq/delete-faq.response.dto';

export class DeleteFaqCommand extends Command<DeleteFaqResponseDto> {
  constructor(public readonly input: DeleteFaqRequestDto) {
    super();
  }
}
