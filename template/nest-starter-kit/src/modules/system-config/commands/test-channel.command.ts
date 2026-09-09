import { Command } from '@nestjs/cqrs';

import type { TestMessengerRequestDto, TestMessengerResponseDto, TestPushRequestDto, TestPushResponseDto, TestSmsRequestDto, TestSmsResponseDto } from '#/modules/system-config/dto';

export class TestSmsCommand extends Command<TestSmsResponseDto> {
  constructor(public readonly input: TestSmsRequestDto) {
    super();
  }
}

export class TestPushCommand extends Command<TestPushResponseDto> {
  constructor(public readonly input: TestPushRequestDto) {
    super();
  }
}

export class TestMessengerCommand extends Command<TestMessengerResponseDto> {
  constructor(public readonly input: TestMessengerRequestDto) {
    super();
  }
}
