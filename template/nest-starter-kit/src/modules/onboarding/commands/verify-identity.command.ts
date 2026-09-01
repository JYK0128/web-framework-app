import { Command } from '@nestjs/cqrs';

import type { VerifyIdentityRequestDto } from '#/modules/onboarding/dto/verify-identity.request.dto';
import type { VerifyIdentityResponseDto } from '#/modules/onboarding/dto/verify-identity.response.dto';

export class VerifyIdentityCommand extends Command<VerifyIdentityResponseDto> {
  constructor(public readonly input: VerifyIdentityRequestDto) {
    super();
  }
}
