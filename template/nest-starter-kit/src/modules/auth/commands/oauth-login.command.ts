import { Command } from '@nestjs/cqrs';

import type { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';
import type { OAuthLoginRequestDto } from '#/modules/auth/dto/oauth-login.request.dto';

export class OAuthLoginCommand extends Command<CurrentUserResponseDto> {
  constructor(
    public readonly input: OAuthLoginRequestDto,
  ) {
    super();
  }
}
