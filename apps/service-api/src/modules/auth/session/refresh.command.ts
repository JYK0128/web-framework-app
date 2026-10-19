import { Command } from '@nestjs/cqrs';

import type { RefreshRequestDto } from '#/modules/auth/session/refresh.request.dto';
import type { RefreshResponseDto } from '#/modules/auth/session/refresh.response.dto';

export class RefreshCommand extends Command<RefreshResponseDto> {
  constructor(
    public readonly input: RefreshRequestDto,
  ) {
    super();
  }
}
