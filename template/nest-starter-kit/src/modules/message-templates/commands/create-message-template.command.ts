import { Command } from '@nestjs/cqrs';

import type { CreateMessageTemplateRequestDto, CreateMessageTemplateResponseDto } from '#/modules/message-templates/dto';

export interface CreateMessageTemplatePayload {
  input: CreateMessageTemplateRequestDto
}

export class CreateMessageTemplateCommand extends Command<CreateMessageTemplateResponseDto> {
  constructor(public readonly input: CreateMessageTemplatePayload) {
    super();
  }
}
