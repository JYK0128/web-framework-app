import { Command } from '@nestjs/cqrs';

import type { TestSmsRequestDto } from '~/modules/system-config/notification/test-sms.request.dto';
import type { TestSmsResponseDto } from '~/modules/system-config/notification/test-sms.response.dto';

export class TestSmsCommand extends Command<TestSmsResponseDto> {
  constructor(public readonly input: TestSmsRequestDto) { super(); }
}
