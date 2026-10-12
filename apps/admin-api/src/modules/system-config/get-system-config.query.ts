import { Query } from '@nestjs/cqrs';

import { GetSystemConfigRequestDto } from './get-system-config.request.dto';
import type { SystemConfigResponseDto } from './system-config.response.dto';

export class GetSystemConfigQuery extends Query<SystemConfigResponseDto> {
  constructor(public readonly input: GetSystemConfigRequestDto = new GetSystemConfigRequestDto()) { super(); }
}
