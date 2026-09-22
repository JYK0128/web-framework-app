import { Command } from '@nestjs/cqrs';

import type { TestChannelResponseDto, TestMessengerRequestDto, TestPushRequestDto, TestSmsRequestDto } from '#/modules/system-config/dto/test-channel.dto';

export class TestSmsCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestSmsRequestDto) { super(); }
}

export class TestPushCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestPushRequestDto) { super(); }
}

export class TestMessengerCommand extends Command<TestChannelResponseDto> {
  constructor(public readonly input: TestMessengerRequestDto) { super(); }
}
