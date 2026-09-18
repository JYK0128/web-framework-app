import { Command } from '@nestjs/cqrs';

import type { TokenRefreshRequestDto, TokenRefreshResponseDto } from '#/modules/auth/dto';

export class TokenRefreshCommand extends Command<TokenRefreshResponseDto> {
  constructor(
    public readonly input: TokenRefreshRequestDto,
    public readonly cookieRefreshToken?: string,
  ) {
    super();
  }
}
