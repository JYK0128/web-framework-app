import { Query } from '@nestjs/cqrs';

import { GetSystemConfigRequestDto, type GetSystemConfigResponseDto } from '#/modules/system-config/dto';

export class GetSystemConfigQuery extends Query<GetSystemConfigResponseDto> {
  constructor(public readonly input: GetSystemConfigRequestDto = new GetSystemConfigRequestDto()) {
    super();
  }
}
