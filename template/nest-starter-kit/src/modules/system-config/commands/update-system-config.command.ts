import { Command } from '@nestjs/cqrs';

import type { SystemConfigKey, UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';

export interface UpdateSystemConfigPayload {
  key: SystemConfigKey
  input: UpdateSystemConfigRequestDto
  adminUserId?: string
}

export class UpdateSystemConfigCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(public readonly payload: UpdateSystemConfigPayload) {
    super();
  }
}
