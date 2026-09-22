import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto, TestEmailResponseDto } from '#/modules/system-config/dto/test-email.dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) { super(); }
}
