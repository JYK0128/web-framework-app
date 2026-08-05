import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { LogoutCommand } from '#/modules/auth/commands/logout.command';
import { LogoutResponseDto } from '#/modules/auth/dto/logout.response.dto';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, LogoutResponseDto> {
  async execute(): Promise<LogoutResponseDto> {
    // Currently, logout has no DB-specific logic, but this handler exists
    // to maintain CQRS architectural consistency. Future DB cleanups
    // (e.g., revoking refresh tokens, logging audit trails) can be added here.
    return { ok: true };
  }
}
