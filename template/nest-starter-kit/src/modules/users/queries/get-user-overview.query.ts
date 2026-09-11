import { Query } from '@nestjs/cqrs';

import { type GetUserOverviewRequestDto, type GetUserOverviewResponseDto } from '#/modules/users/dto';

export class GetUserOverviewQuery extends Query<GetUserOverviewResponseDto> {
  constructor(public readonly input: GetUserOverviewRequestDto) {
    super();
  }
}
