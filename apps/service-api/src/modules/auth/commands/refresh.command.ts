import { Command } from '@nestjs/cqrs';

import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import type { RefreshRequestDto } from '#/modules/auth/dto';

export class RefreshCommand extends Command<TokenPairResult> {
  constructor(
    public readonly input: RefreshRequestDto,
    public readonly cookieRefreshToken?: string,
  ) {
    super();
  }
}
