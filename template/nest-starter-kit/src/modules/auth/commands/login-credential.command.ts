import { Command } from '@nestjs/cqrs';

import type { LoginCredentialRequestDto } from '#/modules/auth/dto/login-credential.request.dto';
import type { LoginCredentialResponseDto } from '#/modules/auth/dto/login-credential.response.dto';

export class LoginCredentialCommand extends Command<LoginCredentialResponseDto> {
  constructor(public readonly input: LoginCredentialRequestDto) {
    super();
  }
}
