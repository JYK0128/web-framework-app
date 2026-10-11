import { Command } from '@nestjs/cqrs';

import type { UpdateServiceConfigRequestDto } from '#/modules/system-configs/dto/update-service-config.request.dto';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-configs/dto/update-system-config.response.dto';

export class UpdateSystemConfigCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly input: UpdateServiceConfigRequestDto) { super(); }
}
