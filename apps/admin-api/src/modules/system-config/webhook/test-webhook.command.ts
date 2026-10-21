import { Command } from '@nestjs/cqrs';

import type { TestWebhookRequestDto } from '~/modules/system-config/webhook/test-webhook.request.dto';
import type { TestWebhookResponseDto } from '~/modules/system-config/webhook/test-webhook.response.dto';

export class TestWebhookCommand extends Command<TestWebhookResponseDto> {
  constructor(public readonly input: TestWebhookRequestDto) { super(); }
}
