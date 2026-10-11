import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.response.dto';
import type { TestPushRequestDto } from '#/modules/system-configs/dto/delivery/test-push.request.dto';

export class TestPushCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestPushRequestDto) { super(); }
}
