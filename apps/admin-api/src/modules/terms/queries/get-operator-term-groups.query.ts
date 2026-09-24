import { Query } from '@nestjs/cqrs';

import type { GetOperatorTermGroupsResponseDto } from '#/modules/terms/interfaces';

export class GetOperatorTermGroupsQuery extends Query<GetOperatorTermGroupsResponseDto> {}
