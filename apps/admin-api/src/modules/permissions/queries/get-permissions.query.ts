import { Query } from '@nestjs/cqrs';

import type { GetPermissionsResponseDto } from '#/modules/permissions/interfaces';

export class GetPermissionsQuery extends Query<GetPermissionsResponseDto> {}
