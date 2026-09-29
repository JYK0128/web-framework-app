import { Command } from '@nestjs/cqrs';

import type { TestAdminEmailRequestDto, TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-email.dto';

export class TestAdminEmailCommand extends Command<TestAdminEmailResponseDto> {
  constructor(public readonly input: TestAdminEmailRequestDto) { super(); }
}
