import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/modules/auth/auth-token.service';
import type { TokenRefreshRequestDto } from '#/modules/auth/dto';

export class TokenRefreshCommand extends Command<TokenPairResult> {
  constructor(
    public readonly input: TokenRefreshRequestDto,
    public readonly cookieRefreshToken?: string,
  ) {
    super();
  }
}
