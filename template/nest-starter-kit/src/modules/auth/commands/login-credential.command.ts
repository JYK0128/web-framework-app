import { Command } from '@nestjs/cqrs';

import type { LoginCredentialInputDto } from '#/modules/auth/dto/login-credential.input.dto';
import type { LoginCredentialOutputDto } from '#/modules/auth/dto/login-credential.output.dto';

export class LoginCredentialCommand extends Command<LoginCredentialOutputDto> {
  constructor(public readonly input: LoginCredentialInputDto) { super(); }
}
