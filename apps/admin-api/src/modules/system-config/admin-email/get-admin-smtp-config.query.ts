import { Query } from '@nestjs/cqrs';

import { AdminSmtpConfigResponseDto } from '#/modules/system-config/admin-email/admin-smtp-config.response.dto';
import { GetAdminSmtpConfigRequestDto } from '#/modules/system-config/admin-email/get-admin-smtp-config.request.dto';

export class GetAdminSmtpConfigQuery extends Query<AdminSmtpConfigResponseDto> {
  constructor(public readonly input: GetAdminSmtpConfigRequestDto = new GetAdminSmtpConfigRequestDto()) { super(); }
}
