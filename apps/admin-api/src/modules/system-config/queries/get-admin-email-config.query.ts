import { Query } from '@nestjs/cqrs';

import type { AdminEmailConfigResponseDto } from '#/modules/system-config/dto/admin-email/admin-email-config.response.dto';

export class GetAdminEmailConfigQuery extends Query<AdminEmailConfigResponseDto> {}
