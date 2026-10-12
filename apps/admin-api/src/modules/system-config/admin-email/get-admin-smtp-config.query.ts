import { Query } from '@nestjs/cqrs';

import { AdminSmtpConfigResponseDto } from './admin-smtp-config.response.dto';
import { GetAdminSmtpConfigRequestDto } from './get-admin-smtp-config.request.dto';

export class GetAdminSmtpConfigQuery extends Query<AdminSmtpConfigResponseDto> {
  constructor(public readonly input: GetAdminSmtpConfigRequestDto = new GetAdminSmtpConfigRequestDto()) { super(); }
}
