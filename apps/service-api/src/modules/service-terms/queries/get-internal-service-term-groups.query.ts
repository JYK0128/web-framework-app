import { Query } from '@nestjs/cqrs';

import { InternalServiceTermGroupListResponseDto } from '#/modules/service-terms/dto';

export class GetInternalServiceTermGroupsQuery extends Query<InternalServiceTermGroupListResponseDto> {}
