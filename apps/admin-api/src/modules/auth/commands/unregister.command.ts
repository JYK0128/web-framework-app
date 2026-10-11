import { Command } from '@nestjs/cqrs';

import type { EmptyProfileSecurityRequestDto } from '#/modules/auth/dto/empty-profile-security.request.dto';
import type { UnregisterResponseDto } from '#/modules/auth/dto/unregister.response.dto';

export class UnregisterCommand extends Command<UnregisterResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}
