import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/service-config/dto/test-channel.response.dto';
import type { TestPushRequestDto } from '#/modules/service-config/dto/test-push.request.dto';

export class TestPushCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestPushRequestDto) { super(); }
}
