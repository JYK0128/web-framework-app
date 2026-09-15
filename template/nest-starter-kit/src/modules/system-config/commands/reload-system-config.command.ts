import { Command } from '@nestjs/cqrs';

import { ReloadSystemConfigRequestDto } from '#/modules/system-config/dto/reload-system-config.request.dto';
import type { ReloadSystemConfigResponseDto } from '#/modules/system-config/dto/reload-system-config.response.dto';

export class ReloadSystemConfigCommand extends Command<ReloadSystemConfigResponseDto> {
  constructor(public readonly input: ReloadSystemConfigRequestDto = new ReloadSystemConfigRequestDto()) {
    super();
  }
}
