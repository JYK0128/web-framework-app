import { Command } from '@nestjs/cqrs';

import type { DeleteInternalServiceTermGroupRequestDto } from '#/modules/service-terms/groups/delete-internal-service-term-group.request.dto';
import { DeleteInternalServiceTermGroupResponseDto } from '#/modules/service-terms/groups/delete-internal-service-term-group.response.dto';

export class DeleteInternalServiceTermGroupCommand extends Command<DeleteInternalServiceTermGroupResponseDto> {
  constructor(public readonly input: DeleteInternalServiceTermGroupRequestDto) {
    super();
  }
}
