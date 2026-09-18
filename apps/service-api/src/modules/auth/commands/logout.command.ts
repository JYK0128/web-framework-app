import { Command } from '@nestjs/cqrs';

import type { LogoutRequestDto, LogoutResponseDto } from '#/modules/auth/dto';

export interface LogoutPayload {
  refreshToken?: string
  input?: LogoutRequestDto
}

export class LogoutCommand extends Command<LogoutResponseDto> {
  constructor(public readonly input: LogoutPayload = {}) {
    super();
  }
}
