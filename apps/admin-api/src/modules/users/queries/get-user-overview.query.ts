import { Query } from '@nestjs/cqrs';

import type { GetUserOverviewResponseDto } from '#/modules/users/interfaces';

export class GetUserOverviewQuery extends Query<GetUserOverviewResponseDto> {}
