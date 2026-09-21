import { Query } from '@nestjs/cqrs';

import type { GetUserTermGroupsResponseDto } from '#/modules/terms/interfaces';

export class GetUserTermGroupsQuery extends Query<GetUserTermGroupsResponseDto> {}
