import { Query } from '@nestjs/cqrs';

import type { GetCustomersRequestDto } from '#/modules/customers/profile/get-customers.request.dto';
import { GetCustomersResponseDto } from '#/modules/customers/profile/get-customers.response.dto';

export class GetCustomersQuery extends Query<GetCustomersResponseDto> {
  constructor(public readonly input: GetCustomersRequestDto) {
    super();
  }
}
