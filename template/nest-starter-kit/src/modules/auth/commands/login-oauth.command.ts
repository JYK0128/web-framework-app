import { Command } from '@nestjs/cqrs';

import type { OAuthCredential, OAuthIdentity } from '#/modules/auth/domain';
import type { LoginOAuthResponseDto } from '#/modules/auth/dto';

export interface LoginOAuthPayload {
  identity: OAuthIdentity
  credential: OAuthCredential
}

export class LoginOAuthCommand extends Command<LoginOAuthResponseDto> {
  constructor(public readonly input: LoginOAuthPayload) {
    super();
  }
}
