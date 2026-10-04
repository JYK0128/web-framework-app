import { Query } from '@nestjs/cqrs';

import type { OperatorTermGroupListResponseDto } from '#/modules/terms/interfaces';

export class GetOperatorTermGroupsQuery extends Query<OperatorTermGroupListResponseDto> {}
