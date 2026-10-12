import { Query } from '@nestjs/cqrs';

import type { GetOperatorOverviewResponseDto } from '#/modules/operators';

export class GetOperatorOverviewQuery extends Query<GetOperatorOverviewResponseDto> {}
