import { Query } from '@nestjs/cqrs';

import type { GetAdminTermGroupsRequestDto, GetAdminTermGroupsResponseDto } from '#/modules/terms/dto';

export class GetAdminTermGroupsQuery extends Query<GetAdminTermGroupsResponseDto> {
  constructor(public readonly input: GetAdminTermGroupsRequestDto = {} as GetAdminTermGroupsRequestDto) {
    super();
  }
}
