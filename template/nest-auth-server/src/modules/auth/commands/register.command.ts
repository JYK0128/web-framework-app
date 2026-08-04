import { Command } from '@nestjs/cqrs';

import type { RegisterInput } from '#/modules/auth/auth.schemas';
import type { AuthResult } from '#/modules/auth/auth.types';

export class RegisterCommand extends Command<AuthResult> {
  constructor(
    public readonly input: RegisterInput,
  ) {
    super();
  }
}
