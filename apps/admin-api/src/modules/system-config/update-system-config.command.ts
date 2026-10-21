import { Command } from '@nestjs/cqrs';

import type { UpdateSystemConfigRequestDto } from '~/modules/system-config/update-system-config.request.dto';
import type { UpdateSystemConfigResponseDto } from '~/modules/system-config/update-system-config.response.dto';

export class UpdateSystemConfigCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly input: UpdateSystemConfigRequestDto) { super(); }
}
