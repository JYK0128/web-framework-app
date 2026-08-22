import { Command } from '@nestjs/cqrs';

import type { BanUserRequestDto, BanUserResponseDto } from '#/modules/users/dto';

export interface BanUserPayload {
  id: string
  input: BanUserRequestDto
  currentUserId: string
}

export class BanUserCommand extends Command<BanUserResponseDto> {
  constructor(public readonly input: BanUserPayload) {
    super();
  }
}
