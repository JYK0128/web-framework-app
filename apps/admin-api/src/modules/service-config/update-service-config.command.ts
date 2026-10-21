import { Command } from '@nestjs/cqrs';

import type { UpdateServiceConfigRequestDto } from '~/modules/service-config/update-service-config.request.dto';
import type { UpdateServiceConfigResponseDto } from '~/modules/service-config/update-service-config.response.dto';

export class UpdateServiceConfigCommand extends Command<UpdateServiceConfigResponseDto> {
  constructor(public readonly input: UpdateServiceConfigRequestDto) { super(); }
}
