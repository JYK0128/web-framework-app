import { Command } from '@nestjs/cqrs';

import type { AdminEmailConfigResponseDto } from '#/modules/system-config/dto/admin-email/admin-email-config.response.dto';
import type { UpdateAdminEmailConfigRequestDto } from '#/modules/system-config/dto/admin-email/update-admin-email-config.request.dto';

export class UpdateAdminEmailConfigCommand extends Command<AdminEmailConfigResponseDto> {
  constructor(public readonly input: UpdateAdminEmailConfigRequestDto) {
    super();
  }
}
