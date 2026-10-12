import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto } from '#/modules/system-config/notification/test-email.request.dto';
import type { TestEmailResponseDto } from '#/modules/system-config/notification/test-email.response.dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) { super(); }
}
