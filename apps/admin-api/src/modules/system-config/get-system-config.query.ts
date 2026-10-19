import { Query } from '@nestjs/cqrs';

import { GetSystemConfigRequestDto } from '#/modules/system-config/get-system-config.request.dto';
import type { GetSystemConfigResponseDto } from '#/modules/system-config/get-system-config.response.dto';

export class GetSystemConfigQuery extends Query<GetSystemConfigResponseDto> {
  constructor(public readonly input: GetSystemConfigRequestDto = new GetSystemConfigRequestDto()) { super(); }
}
