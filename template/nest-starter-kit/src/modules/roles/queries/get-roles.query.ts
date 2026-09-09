import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto, GetRolesResponseDto } from '#/modules/roles/dto';

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor(public readonly input: GetRolesRequestDto = {} as GetRolesRequestDto) {
    super();
  }
}
