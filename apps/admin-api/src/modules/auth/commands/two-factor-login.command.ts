import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/core/auth/user/user-auth.interface';
import type { TwoFactorLoginRequestDto } from '#/modules/auth/interfaces';

export class TwoFactorLoginCommand extends Command<TokenPairResult> {
  constructor(public readonly input: TwoFactorLoginRequestDto) { super(); }
}
