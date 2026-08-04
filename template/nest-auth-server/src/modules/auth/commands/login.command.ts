import { Command } from '@nestjs/cqrs';

import type { LoginInput } from '#/modules/auth/auth.schemas';
import type { AuthResult } from '#/modules/auth/auth.types';

export class LoginCommand extends Command<AuthResult> {
  constructor(
    public readonly input: LoginInput,
  ) {
    super();
  }
}
