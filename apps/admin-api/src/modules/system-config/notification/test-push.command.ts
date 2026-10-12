import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/system-config/notification/test-channel.response.dto';
import type { TestPushRequestDto } from '#/modules/system-config/notification/test-push.request.dto';

export class TestPushCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestPushRequestDto) { super(); }
}
