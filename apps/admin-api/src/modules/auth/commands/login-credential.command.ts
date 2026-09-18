import { Command } from '@nestjs/cqrs';

import type { LoginCredentialRequestDto, LoginCredentialResponseDto } from '#/modules/auth/dto';

export interface ClientMeta {
  ip?: string
  userAgent?: string
}

export class LoginCredentialCommand extends Command<LoginCredentialResponseDto> {
  constructor(
    public readonly input: LoginCredentialRequestDto,
    public readonly meta?: ClientMeta,
  ) {
    super();
  }
}
