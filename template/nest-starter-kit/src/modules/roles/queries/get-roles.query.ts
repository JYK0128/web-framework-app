import { Query } from '@nestjs/cqrs';

import { GetRolesRequestDto, type GetRolesResponseDto } from '#/modules/roles/dto';

export interface GetRolesPayload {
  query: GetRolesRequestDto
}

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor(public readonly input: GetRolesPayload = { query: new GetRolesRequestDto() }) {
    super();
  }
}
