import { Command } from '@nestjs/cqrs';

import type { UpdateMessageTemplateRequestDto, UpdateMessageTemplateResponseDto } from '#/modules/message-templates/dto';

export interface UpdateMessageTemplatePayload {
  messageTemplateId: string
  input: UpdateMessageTemplateRequestDto
}

export class UpdateMessageTemplateCommand extends Command<UpdateMessageTemplateResponseDto> {
  constructor(public readonly input: UpdateMessageTemplatePayload) {
    super();
  }
}
