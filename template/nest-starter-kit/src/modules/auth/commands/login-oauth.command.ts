import { Command } from '@nestjs/cqrs';

import type { OAuthProvider } from '#/infra/oauth';
import type { LoginOAuthResponseDto } from '#/modules/auth/dto/login-oauth.response.dto';

export interface LoginOAuthPayload {
  provider: OAuthProvider
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
