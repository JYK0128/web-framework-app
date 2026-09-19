import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/modules/auth/auth-token.service';
import type { LoginCredentialRequestDto } from '#/modules/auth/dto';

export interface ClientMeta {
  ip?: string
  userAgent?: string
}

export class LoginCredentialCommand extends Command<TokenPairResult> {
  constructor(
    public readonly input: LoginCredentialRequestDto,
    public readonly meta?: ClientMeta,
  ) {
    super();
  }
}
