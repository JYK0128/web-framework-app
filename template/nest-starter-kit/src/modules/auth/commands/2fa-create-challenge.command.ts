import { Command } from '@nestjs/cqrs';

import { Create2FAChallengeRequestDto } from '#/modules/auth/dto/2fa-create-challenge.request.dto';
import { Create2FAChallengeResponseDto } from '#/modules/auth/dto/2fa-create-challenge.response.dto';

export class Create2FAChallengeCommand extends Command<Create2FAChallengeResponseDto> {
  constructor(public readonly input: Create2FAChallengeRequestDto) { super(); }
}
