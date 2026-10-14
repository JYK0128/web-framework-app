import { Command } from '@nestjs/cqrs';

import { type CreateInternalServiceTermRequestDto } from '#/modules/service-terms/documents/create-internal-service-term.request.dto';
import { CreateInternalServiceTermResponseDto } from '#/modules/service-terms/documents/create-internal-service-term.response.dto';

export class CreateInternalServiceTermCommand extends Command<CreateInternalServiceTermResponseDto> {
  constructor(public readonly input: CreateInternalServiceTermRequestDto) {
    super();
  }
}
