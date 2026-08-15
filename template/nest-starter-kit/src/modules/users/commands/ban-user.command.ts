import type { BanUserRequestDto } from '#/modules/users/dto';

export class BanUserCommand {
  constructor(
    public readonly id: string,
    public readonly input: BanUserRequestDto,
    public readonly currentUserId: string,
  ) {}
}
