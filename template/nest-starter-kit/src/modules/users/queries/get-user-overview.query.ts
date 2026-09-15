import { Query } from '@nestjs/cqrs';

import { type GetUserOverviewRequestDto, type GetUserOverviewResponseDto } from '#/modules/users/dto';

export interface GetUserOverviewPayload {
  query: GetUserOverviewRequestDto
}

export class GetUserOverviewQuery extends Query<GetUserOverviewResponseDto> {
  constructor(public readonly input: GetUserOverviewPayload) {
    super();
  }
}
