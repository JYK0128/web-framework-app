import { Command } from '@nestjs/cqrs';

import type { TestEmailRequestDto } from '#/modules/service-config/dto/test-email.request.dto';
import type { TestEmailResponseDto } from '#/modules/service-config/dto/test-email.response.dto';

export class TestEmailCommand extends Command<TestEmailResponseDto> {
  constructor(public readonly input: TestEmailRequestDto) { super(); }
}
