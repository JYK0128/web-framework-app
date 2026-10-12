import { Query } from '@nestjs/cqrs';

import type { PermissionListResponseDto } from '#/modules/permissions';

export class GetPermissionsQuery extends Query<PermissionListResponseDto> {}
