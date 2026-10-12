import { Command } from '@nestjs/cqrs';

import type { UnregisterRequestDto } from '#/modules/auth/dto/unregister.request.dto';
import type { UnregisterResponseDto } from '#/modules/auth/dto/unregister.response.dto';

export class UnregisterCommand extends Command<UnregisterResponseDto> {
  constructor(public readonly input: UnregisterRequestDto) { super(); }
}
