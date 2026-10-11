import { Query } from '@nestjs/cqrs';

import type { PermissionListResponseDto } from '#/modules/permissions/dto';

export class GetPermissionsQuery extends Query<PermissionListResponseDto> {}
