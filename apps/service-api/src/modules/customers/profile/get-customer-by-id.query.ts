import { Query } from '@nestjs/cqrs';

import type { GetCustomerRequestDto } from '#/modules/customers/profile/get-customer.request.dto';
import { GetCustomerResponseDto } from '#/modules/customers/profile/get-customer.response.dto';

export class GetCustomerByIdQuery extends Query<GetCustomerResponseDto> {
  constructor(public readonly input: GetCustomerRequestDto) {
    super();
  }
}
