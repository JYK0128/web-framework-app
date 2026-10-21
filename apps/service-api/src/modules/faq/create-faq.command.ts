import { Command } from '@nestjs/cqrs';

import { type CreateFaqRequestDto } from '~/modules/faq/create-faq.request.dto';
import { CreateFaqResponseDto } from '~/modules/faq/create-faq.response.dto';

export class CreateFaqCommand extends Command<CreateFaqResponseDto> {
  constructor(public readonly input: CreateFaqRequestDto) {
    super();
  }
}
