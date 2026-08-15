import { Command } from '@nestjs/cqrs';

import type { ImpersonationTokenResponseDto, UserProfileResponseDto } from '#/modules/auth/dto';

export class ImpersonateUserCommand extends Command<ImpersonationTokenResponseDto> {
  constructor(
    public readonly id: string,
    public readonly currentUser: UserProfileResponseDto,
  ) {
    super();
  }
}
