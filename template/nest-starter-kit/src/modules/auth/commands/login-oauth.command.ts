import { Command } from '@nestjs/cqrs';

import type { LoginOAuthRequestDto } from '#/modules/auth/dto/login-oauth.request.dto';
import type { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class LoginOAuthCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: LoginOAuthRequestDto) { super(); }
}
