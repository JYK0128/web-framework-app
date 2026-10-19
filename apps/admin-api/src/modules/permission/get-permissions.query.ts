import { Query } from '@nestjs/cqrs';

import type { GetPermissionsRequestDto } from '#/modules/permission/get-permissions.request.dto';
import type { GetPermissionsResponseDto } from '#/modules/permission/get-permissions.response.dto';

export class GetPermissionsQuery extends Query<GetPermissionsResponseDto> {
  constructor(public readonly input: GetPermissionsRequestDto) { super(); }
}
