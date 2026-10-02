import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import type { LoginRequestDto } from '#/modules/auth/dto';

export interface TwoFactorLoginChallengeResult {
  requiresTwoFactor: true
  twoFactorChallengeToken: string
}

export type LoginResult = TwoFactorLoginChallengeResult | (TokenPairResult & { requiresTwoFactor?: false });

export class LoginCommand extends Command<LoginResult> {
  constructor(
    public readonly input: LoginRequestDto,
  ) {
    super();
  }
}
