import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto, TestEmailResponseDto } from '#/modules/system-configs/dto/delivery/test-email.dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) { super(); }
}
