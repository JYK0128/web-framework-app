import { Command } from '@nestjs/cqrs';

import type { UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';

export class UpdateSystemConfigCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly input: UpdateSystemConfigRequestDto) { super(); }
}
