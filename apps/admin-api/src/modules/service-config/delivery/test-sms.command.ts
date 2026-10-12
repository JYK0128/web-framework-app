import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/service-config/delivery/test-channel.response.dto';
import type { TestSmsRequestDto } from '#/modules/service-config/delivery/test-sms.request.dto';

export class TestSmsCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestSmsRequestDto) { super(); }
}
