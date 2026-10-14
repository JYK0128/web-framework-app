import { Command } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupRequestDto } from '#/modules/service-terms/groups/create-internal-service-term-group.request.dto';
import { CreateInternalServiceTermGroupResponseDto } from '#/modules/service-terms/groups/create-internal-service-term-group.response.dto';

export class CreateInternalServiceTermGroupCommand extends Command<CreateInternalServiceTermGroupResponseDto> {
  constructor(public readonly input: CreateInternalServiceTermGroupRequestDto) {
    super();
  }
}
