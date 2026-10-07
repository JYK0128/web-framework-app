import { Query } from '@nestjs/cqrs';

import type { PermissionListResponseDto } from '#/modules/permissions/interfaces';

export class GetPermissionsQuery extends Query<PermissionListResponseDto> {}
