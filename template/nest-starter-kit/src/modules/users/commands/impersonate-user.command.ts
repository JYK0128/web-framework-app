import type { UserProfileResponseDto } from '#/modules/auth/dto';

export class ImpersonateUserCommand {
  constructor(
    public readonly id: string,
    public readonly currentUser: UserProfileResponseDto,
  ) {}
}
