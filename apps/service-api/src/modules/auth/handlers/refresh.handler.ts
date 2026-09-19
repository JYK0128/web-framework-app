import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { type IUserAuthService, type TokenPairResult, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { RefreshCommand } from '#/modules/auth/commands/refresh.command';

@Injectable()
@CommandHandler(RefreshCommand)
export class RefreshHandler implements ICommandHandler<RefreshCommand> {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly authService: IUserAuthService,
  ) {}

  async execute(command: RefreshCommand): Promise<TokenPairResult> {
    return this.authService.refresh({ refreshToken: command.input.refreshToken, cookieRefreshToken: command.cookieRefreshToken });
  }
}
