import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/system-config/notification/test-channel.response.dto';
import type { TestSmsRequestDto } from '#/modules/system-config/notification/test-sms.request.dto';

export class TestSmsCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestSmsRequestDto) { super(); }
}
