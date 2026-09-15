import { Command } from '@nestjs/cqrs';

import type { Verify2FAChallengeRequestDto } from '#/modules/auth/dto/verify-2fa-challenge.request.dto';
import type { Verify2FAChallengeResponseDto } from '#/modules/auth/dto/verify-2fa-challenge.response.dto';

export class Verify2FAChallengeCommand extends Command<Verify2FAChallengeResponseDto> {
  constructor(public readonly input: Verify2FAChallengeRequestDto) {
    super();
  }
}
