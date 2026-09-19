import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import type { LoginRequestDto } from '#/modules/auth/dto';

export class LoginCommand extends Command<TokenPairResult> {
  constructor(
    public readonly input: LoginRequestDto,
  ) {
    super();
  }
}
