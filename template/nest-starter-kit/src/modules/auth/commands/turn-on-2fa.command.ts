import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';
import { TurnOn2FARequestDto } from '#/modules/auth/dto/turn-on-2fa.request.dto';

export class TurnOn2FACommand {
  constructor(
    public readonly user: CurrentUserResponseDto,
    public readonly input: TurnOn2FARequestDto,
  ) {}
}
