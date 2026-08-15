import { Command } from '@nestjs/cqrs';

import type { BanUserRequestDto, UserDetailDto } from '#/modules/users/dto';

export class BanUserCommand extends Command<UserDetailDto> {
  constructor(
    public readonly id: string,
    public readonly input: BanUserRequestDto,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
