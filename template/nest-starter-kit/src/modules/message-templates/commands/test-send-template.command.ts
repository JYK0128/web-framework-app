import { Command } from '@nestjs/cqrs';

import type { TestSendTemplateRequestDto, TestSendTemplateResponseDto } from '#/modules/message-templates/dto';

export interface TestSendTemplatePayload {
  id: string
  input: TestSendTemplateRequestDto
}

export class TestSendTemplateCommand extends Command<TestSendTemplateResponseDto> {
  constructor(public readonly input: TestSendTemplatePayload) {
    super();
  }
}
