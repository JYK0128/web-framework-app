import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

export class Generate2FACommand {
  constructor(public readonly user: CurrentUserResponseDto) {}
}
