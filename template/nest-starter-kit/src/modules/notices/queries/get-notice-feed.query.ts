import type { GetNoticeFeedRequestDto } from '#/modules/notices/dto';

export class GetNoticeFeedQuery {
  constructor(
    public readonly query: GetNoticeFeedRequestDto,
    public readonly userId: string,
  ) {}
}
