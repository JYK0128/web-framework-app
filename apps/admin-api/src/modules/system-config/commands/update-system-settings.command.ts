import { Command } from '@nestjs/cqrs';

import type { UpdateSystemConfigResponseDto } from '#/modules/system-config/dto/update-system-config.response.dto';
import type { UpdateSystemSettingsRequestDto } from '#/modules/system-config/dto/update-system-settings.request.dto';

export class UpdateSystemSettingsCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly input: UpdateSystemSettingsRequestDto) { super(); }
}
