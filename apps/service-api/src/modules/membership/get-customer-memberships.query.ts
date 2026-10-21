import { Query } from '@nestjs/cqrs';

import type { GetCustomerMembershipsRequestDto } from '~/modules/membership/get-customer-memberships.request.dto';
import { GetCustomerMembershipsResponseDto } from '~/modules/membership/get-customer-memberships.response.dto';

export class GetCustomerMembershipsQuery extends Query<GetCustomerMembershipsResponseDto> {
  constructor(public readonly input: GetCustomerMembershipsRequestDto) {
    super();
  }
}
