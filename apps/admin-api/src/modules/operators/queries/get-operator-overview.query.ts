import { Query } from '@nestjs/cqrs';

import type { GetOperatorOverviewResponseDto } from '#/modules/operators/dto';

export class GetOperatorOverviewQuery extends Query<GetOperatorOverviewResponseDto> {}
