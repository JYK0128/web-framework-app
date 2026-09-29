import { Query } from '@nestjs/cqrs';

import type { GetRolesResponseDto } from '#/modules/roles/interfaces';

export class GetRolesQuery extends Query<GetRolesResponseDto> {}
