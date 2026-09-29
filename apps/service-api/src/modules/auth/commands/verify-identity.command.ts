import { Command } from '@nestjs/cqrs';

import type { VerifyIdentityRequestDto, VerifyIdentityResponseDto } from '#/modules/auth/dto/verify-identity.dto';

export class VerifyIdentityCommand extends Command<VerifyIdentityResponseDto> {
  constructor(public readonly input: VerifyIdentityRequestDto) { super(); }
}
