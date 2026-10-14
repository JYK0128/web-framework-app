import { Query } from '@nestjs/cqrs';

import type { GetPermissionsRequestDto } from '#/modules/permissions/get-permissions.request.dto';
import type { GetPermissionsResponseDto } from '#/modules/permissions/get-permissions.response.dto';

export class GetPermissionsQuery extends Query<GetPermissionsResponseDto> {
  constructor(public readonly input: GetPermissionsRequestDto) { super(); }
}
