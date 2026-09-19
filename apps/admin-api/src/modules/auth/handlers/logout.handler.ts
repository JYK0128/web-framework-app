import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { LogoutCommand } from '#/modules/auth/commands/logout.command';
import { LogoutResponseDto } from '#/modules/auth/interfaces/logout.response.dto';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, LogoutResponseDto> {
  constructor(@Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: LogoutCommand): Promise<LogoutResponseDto> {
    await this.userAuthService.logout(command.refreshToken);
    return LogoutResponseDto.fromPlain({ ok: true });
  }
}
