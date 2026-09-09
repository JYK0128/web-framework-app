import { Query } from '@nestjs/cqrs';

import type { GetAdminSystemConfigRequestDto, GetAdminSystemConfigResponseDto } from '#/modules/system-config/dto';

export class GetAdminSystemConfigQuery extends Query<GetAdminSystemConfigResponseDto> {
  constructor(public readonly input?: GetAdminSystemConfigRequestDto) {
    super();
  }
}
