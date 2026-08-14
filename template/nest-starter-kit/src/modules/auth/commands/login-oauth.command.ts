import { Command } from '@nestjs/cqrs';

import type { LoginOAuthInputDto } from '#/modules/auth/dto/login-oauth.input.dto';
import type { LoginOAuthOutputDto } from '#/modules/auth/dto/login-oauth.output.dto';

export class LoginOAuthCommand extends Command<LoginOAuthOutputDto> {
  constructor(public readonly input: LoginOAuthInputDto) { super(); }
}
