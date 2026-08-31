import { Command } from '@nestjs/cqrs';

import type { DeleteFaqResponseDto } from '#/modules/faqs/dto';

export interface DeleteFaqPayload {
  id: string
}

export class DeleteFaqCommand extends Command<DeleteFaqResponseDto> {
  constructor(public readonly input: DeleteFaqPayload) {
    super();
  }
}
