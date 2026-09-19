import { Query } from '@nestjs/cqrs';

import type { GetAdminTermGroupsResponseDto } from '#/modules/terms/interfaces';

export class GetAdminTermGroupsQuery extends Query<GetAdminTermGroupsResponseDto> {}
