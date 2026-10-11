import { Query } from '@nestjs/cqrs';

import type { OperatorTermGroupListResponseDto } from '#/modules/terms/dto';

export class GetOperatorTermGroupsQuery extends Query<OperatorTermGroupListResponseDto> {}
