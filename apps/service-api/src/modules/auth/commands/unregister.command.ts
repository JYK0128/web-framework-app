import { Command } from '@nestjs/cqrs';

import type { UnregisterRequestDto, UnregisterResponseDto } from '#/modules/auth/dto';

export class UnregisterCommand extends Command<UnregisterResponseDto> {
  constructor(public readonly input: UnregisterRequestDto) { super(); }
}
