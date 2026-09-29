import { Command } from '@nestjs/cqrs';

import type { LogoutResponseDto } from '#/modules/auth/dto';

export class LogoutCommand extends Command<LogoutResponseDto> {
  constructor(public readonly refreshToken?: string) {
    super();
  }
}
