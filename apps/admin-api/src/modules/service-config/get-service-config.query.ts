import { Query } from '@nestjs/cqrs';

import { GetServiceConfigRequestDto } from './get-service-config.request.dto';
import type { ServiceConfigResponseDto } from './service-config.response.dto';

export class GetServiceConfigQuery extends Query<ServiceConfigResponseDto> {
  constructor(public readonly input: GetServiceConfigRequestDto) { super(); }
}
