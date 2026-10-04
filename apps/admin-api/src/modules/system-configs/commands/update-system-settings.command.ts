import { Command } from '@nestjs/cqrs';

import type { UpdateSystemConfigResponseDto, UpdateSystemSettingsRequestDto } from '#/modules/system-configs/system-config.interfaces';

export class UpdateSystemSettingsCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly input: UpdateSystemSettingsRequestDto) { super(); }
}
