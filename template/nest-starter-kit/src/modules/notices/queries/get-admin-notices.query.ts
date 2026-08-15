import type { GetAdminNoticesRequestDto } from '#/modules/notices/dto';

export class GetAdminNoticesQuery {
  constructor(public readonly query: GetAdminNoticesRequestDto) {}
}
