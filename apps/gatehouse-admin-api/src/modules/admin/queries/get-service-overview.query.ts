import { Query } from '@nestjs/cqrs';

import { ServiceOverviewResponseDto } from '#/modules/admin/service-user.dto';

export class GetServiceOverviewQuery extends Query<ServiceOverviewResponseDto> {}
