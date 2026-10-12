import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { RefreshCommand } from '#/modules/auth/session/refresh.command';
import { RefreshResponseDto } from '#/modules/auth/session/refresh.response.dto';

@Injectable()
@CommandHandler(RefreshCommand)
export class RefreshHandler implements ICommandHandler<RefreshCommand, RefreshResponseDto> {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly authService: IUserAuthService,
  ) {}

  async execute(command: RefreshCommand): Promise<RefreshResponseDto> {
    const result = await this.authService.refresh({ refreshToken: command.input.refreshToken });
    return RefreshResponseDto.parse({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
}
