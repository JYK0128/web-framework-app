import { Query } from '@nestjs/cqrs';

import type { GetNoticeFeedRequestDto, GetNoticeFeedResponseDto } from '#/modules/notices/dto';

export class GetNoticeFeedQuery extends Query<GetNoticeFeedResponseDto> {
  constructor(
    public readonly query: GetNoticeFeedRequestDto,
    public readonly userId: string,
  ) {
    super();
  }
}
