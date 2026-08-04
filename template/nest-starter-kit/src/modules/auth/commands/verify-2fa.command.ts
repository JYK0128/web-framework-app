import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';
import { Verify2FARequestDto } from '#/modules/auth/dto/verify-2fa.request.dto';

export class Verify2FACommand {
  constructor(
    public readonly user: CurrentUserResponseDto,
    public readonly input: Verify2FARequestDto,
  ) {}
}
