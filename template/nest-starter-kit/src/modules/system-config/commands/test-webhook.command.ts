import { Command } from '@nestjs/cqrs';

import type { TestWebhookRequestDto, TestWebhookResponseDto } from '#/modules/system-config/dto';

export class TestWebhookCommand extends Command<TestWebhookResponseDto> {
  constructor(public readonly input: TestWebhookRequestDto) {
    super();
  }
}
