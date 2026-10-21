import { Command } from '@nestjs/cqrs';

import type { TestPushRequestDto } from '~/modules/system-config/notification/test-push.request.dto';
import type { TestPushResponseDto } from '~/modules/system-config/notification/test-push.response.dto';

export class TestPushCommand extends Command<TestPushResponseDto> {
  constructor(public readonly input: TestPushRequestDto) { super(); }
}
