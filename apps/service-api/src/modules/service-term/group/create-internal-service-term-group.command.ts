import { Command } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupRequestDto } from '#/modules/service-term/group/create-internal-service-term-group.request.dto';
import { CreateInternalServiceTermGroupResponseDto } from '#/modules/service-term/group/create-internal-service-term-group.response.dto';

export class CreateInternalServiceTermGroupCommand extends Command<CreateInternalServiceTermGroupResponseDto> {
  constructor(public readonly input: CreateInternalServiceTermGroupRequestDto) {
    super();
  }
}
