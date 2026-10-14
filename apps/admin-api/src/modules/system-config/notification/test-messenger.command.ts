import { Command } from '@nestjs/cqrs';

import type { TestMessengerRequestDto } from '#/modules/system-config/notification/test-messenger.request.dto';
import type { TestMessengerResponseDto } from '#/modules/system-config/notification/test-messenger.response.dto';

export class TestMessengerCommand extends Command<TestMessengerResponseDto> {
  constructor(public readonly input: TestMessengerRequestDto) { super(); }
}
