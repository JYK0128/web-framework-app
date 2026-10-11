import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto } from '#/modules/system-configs/dto/delivery/test-email.request.dto';
import type { TestEmailResponseDto } from '#/modules/system-configs/dto/delivery/test-email.response.dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) { super(); }
}
