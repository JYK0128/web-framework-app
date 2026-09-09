import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto, TestEmailResponseDto } from '#/modules/system-config/dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) {
    super();
  }
}
