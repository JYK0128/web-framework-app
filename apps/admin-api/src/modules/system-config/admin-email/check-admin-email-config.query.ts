import { Query } from '@nestjs/cqrs';

import { CheckAdminEmailConfigRequestDto } from '~/modules/system-config/admin-email/check-admin-email-config.request.dto';
import type { CheckAdminEmailConfigResponseDto } from '~/modules/system-config/admin-email/check-admin-email-config.response.dto';

export class CheckAdminEmailConfigQuery extends Query<CheckAdminEmailConfigResponseDto> {
  constructor(public readonly input: CheckAdminEmailConfigRequestDto = new CheckAdminEmailConfigRequestDto()) { super(); }
}
