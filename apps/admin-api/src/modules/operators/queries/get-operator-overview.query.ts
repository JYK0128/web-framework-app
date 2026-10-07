import { Query } from '@nestjs/cqrs';

import type { GetOperatorOverviewResponseDto } from '#/modules/operators/interfaces';

export class GetOperatorOverviewQuery extends Query<GetOperatorOverviewResponseDto> {}
