import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto } from '#/modules/service-config/dto/delivery/test-channel.response.dto';
import type { TestMessengerRequestDto } from '#/modules/service-config/dto/delivery/test-messenger.request.dto';

export class TestMessengerCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestMessengerRequestDto) { super(); }
}
