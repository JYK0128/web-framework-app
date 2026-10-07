import { Query } from '@nestjs/cqrs';

import { GetAdminSystemConfigRequestDto, type GetAdminSystemConfigResponseDto } from '#/modules/system-config/dto';

export class GetAdminSystemConfigQuery extends Query<GetAdminSystemConfigResponseDto> {
  constructor(public readonly input: GetAdminSystemConfigRequestDto = new GetAdminSystemConfigRequestDto()) {
    super();
  }
}
