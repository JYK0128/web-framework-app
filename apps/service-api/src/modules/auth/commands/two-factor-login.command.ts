import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import type { TwoFactorLoginRequestDto } from '#/modules/auth/dto';

export class TwoFactorLoginCommand extends Command<TokenPairResult> {
  constructor(public readonly input: TwoFactorLoginRequestDto) {
    super();
  }
}
