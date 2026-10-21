import { Command } from '@nestjs/cqrs';

import type { TestAdminEmailRequestDto } from '~/modules/system-config/admin-email/test-admin-email.request.dto';
import type { TestAdminEmailResponseDto } from '~/modules/system-config/admin-email/test-admin-email.response.dto';

export class TestAdminEmailCommand extends Command<TestAdminEmailResponseDto> {
  constructor(public readonly input: TestAdminEmailRequestDto) { super(); }
}
