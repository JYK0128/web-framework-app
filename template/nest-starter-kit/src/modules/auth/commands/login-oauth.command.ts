import { Command } from '@nestjs/cqrs';

import type { LoginOAuthResponseDto } from '#/modules/auth/dto/login-oauth.response.dto';

export interface LoginOAuthPayload {
  provider: string
  accountId: string
  email: string
  name: string
  accessToken?: string | null
  refreshToken?: string | null
}

export class LoginOAuthCommand extends Command<LoginOAuthResponseDto> {
  constructor(public readonly input: LoginOAuthPayload) {
    super();
  }
}
