import { Command } from '@nestjs/cqrs';

import type { ReloadSystemConfigRequestDto } from '#/modules/system-config/dto/reload-system-config.request.dto';
import type { ReloadSystemConfigResponseDto } from '#/modules/system-config/dto/reload-system-config.response.dto';

export class ReloadSystemConfigCommand extends Command<ReloadSystemConfigResponseDto> {
  constructor(public readonly input: ReloadSystemConfigRequestDto) {
    super();
  }
}
