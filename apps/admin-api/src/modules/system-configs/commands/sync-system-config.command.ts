import { Command } from '@nestjs/cqrs';

import type { SyncSystemConfigRequestDto } from '#/modules/system-configs/dto/sync-system-config.request.dto';
import type { SyncSystemConfigResponseDto } from '#/modules/system-configs/dto/sync-system-config.response.dto';

export class SyncSystemConfigCommand extends Command<SyncSystemConfigResponseDto> {
  constructor(public readonly input: SyncSystemConfigRequestDto) { super(); }
}
