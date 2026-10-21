import { Command } from '@nestjs/cqrs';

import type { LogoutRequestDto } from '~/modules/auth/session/logout.request.dto';
import type { LogoutResponseDto } from '~/modules/auth/session/logout.response.dto';

export class LogoutCommand extends Command<LogoutResponseDto> {
  constructor(public readonly input: LogoutRequestDto) {
    super();
  }
}
