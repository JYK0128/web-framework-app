import { Query } from '@nestjs/cqrs';

import { GetServiceConfigRequestDto } from '~/modules/service-config/get-service-config.request.dto';
import type { GetServiceConfigResponseDto } from '~/modules/service-config/get-service-config.response.dto';

export class GetServiceConfigQuery extends Query<GetServiceConfigResponseDto> {
  constructor(public readonly input: GetServiceConfigRequestDto) { super(); }
}
