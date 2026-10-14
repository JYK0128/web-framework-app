import { Command } from '@nestjs/cqrs';

import type { DeleteInternalServiceTermRequestDto } from '#/modules/service-terms/documents/delete-internal-service-term.request.dto';
import { type DeleteInternalServiceTermResponseDto } from '#/modules/service-terms/documents/delete-internal-service-term.response.dto';

export class DeleteInternalServiceTermCommand extends Command<DeleteInternalServiceTermResponseDto> {
  constructor(public readonly input: DeleteInternalServiceTermRequestDto) {
    super();
  }
}
