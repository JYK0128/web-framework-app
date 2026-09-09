import { Query } from '@nestjs/cqrs';

import type { GetSystemConfigRequestDto, GetSystemConfigResponseDto } from '#/modules/system-config/dto';

export class GetSystemConfigQuery extends Query<GetSystemConfigResponseDto> {
  constructor(public readonly input?: GetSystemConfigRequestDto) {
    super();
  }
}
