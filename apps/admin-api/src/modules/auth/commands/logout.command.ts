import { Command } from '@nestjs/cqrs';

import type { LogoutRequestDto, LogoutResponseDto } from '#/modules/auth/interfaces';

export class LogoutCommand extends Command<LogoutResponseDto> {
  constructor(public readonly input: LogoutRequestDto) {
    super();
  }
}
