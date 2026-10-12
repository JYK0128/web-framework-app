import { Query } from '@nestjs/cqrs';

import { InternalServiceTermGroupListResponseDto } from '#/modules/service-terms';

export class GetInternalServiceTermGroupsQuery extends Query<InternalServiceTermGroupListResponseDto> {}
