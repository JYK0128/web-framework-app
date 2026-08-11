import { Query } from '@nestjs/cqrs';

import { AdminOverviewResponseDto } from '#/modules/admin/admin.dto';

export class GetAdminOverviewQuery extends Query<AdminOverviewResponseDto> {}
