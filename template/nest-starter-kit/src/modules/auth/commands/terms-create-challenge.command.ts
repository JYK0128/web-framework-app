import { Command } from '@nestjs/cqrs';

import { TermsCreateChallengeRequestDto } from '#/modules/auth/dto/terms-create-challenge.request.dto';
import type { TermsCreateChallengeResponseDto } from '#/modules/auth/dto/terms-create-challenge.response.dto';

export class TermsCreateChallengeCommand extends Command<TermsCreateChallengeResponseDto> {
  constructor(public readonly input: TermsCreateChallengeRequestDto) { super(); }
}
