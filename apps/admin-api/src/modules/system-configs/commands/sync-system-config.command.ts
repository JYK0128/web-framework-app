import { Command } from '@nestjs/cqrs';

import type { SyncSystemConfigRequestDto, SyncSystemConfigResponseDto } from '#/modules/system-configs/system-config.interfaces';

export class SyncSystemConfigCommand extends Command<SyncSystemConfigResponseDto> {
  constructor(public readonly input: SyncSystemConfigRequestDto) { super(); }
}
