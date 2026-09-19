import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TokenStoreService } from '#/common/services/token-store.service';
import { LogoutCommand } from '#/modules/auth/commands/logout.command';
import { LogoutResponseDto } from '#/modules/auth/dto/logout.response.dto';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, LogoutResponseDto> {
  constructor(private readonly tokenStoreService: TokenStoreService) {}

  async execute(command: LogoutCommand): Promise<LogoutResponseDto> {
    const refreshToken = command.input.input?.refreshToken || command.input.refreshToken;
    if (refreshToken) {
      await this.tokenStoreService.revokeRefreshToken(refreshToken);
    }
    return LogoutResponseDto.fromPlain({ ok: true });
  }
}
