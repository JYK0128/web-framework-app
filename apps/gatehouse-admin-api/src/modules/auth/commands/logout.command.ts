import { Command } from '@nestjs/cqrs';

import { LogoutResponseDto } from '#/modules/auth/dto/logout.response.dto';

export class LogoutCommand extends Command<LogoutResponseDto> {
  constructor(public readonly input: Record<string, never> = {}) { super(); }
}
