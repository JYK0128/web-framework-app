import { Query } from '@nestjs/cqrs';

import type { OperatorTermGroupListResponseDto } from '#/modules/terms';

export class GetOperatorTermGroupsQuery extends Query<OperatorTermGroupListResponseDto> {}
