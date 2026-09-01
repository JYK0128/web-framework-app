import { Command } from '@nestjs/cqrs';

import type { DeleteMessageTemplateResponseDto } from '#/modules/message-templates/dto';

export interface DeleteMessageTemplatePayload {
  id: string
  deletedBy?: string
}

export class DeleteMessageTemplateCommand extends Command<DeleteMessageTemplateResponseDto> {
  constructor(public readonly input: DeleteMessageTemplatePayload) {
    super();
  }
}
