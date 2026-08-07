import { Command } from '@nestjs/cqrs';

import type { LoginOAuthRequestDto } from '#/modules/auth/dto/login-oauth.request.dto';
import type { LoginOAuthResponseDto } from '#/modules/auth/dto/login-oauth.response.dto';

export class LoginOAuthCommand extends Command<LoginOAuthResponseDto> {
  constructor(public readonly input: LoginOAuthRequestDto) { super(); }
}
