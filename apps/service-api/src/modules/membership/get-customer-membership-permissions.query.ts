import { Query } from '@nestjs/cqrs';

import type { GetCustomerMembershipPermissionsRequestDto } from '#/modules/membership/get-customer-membership-permissions.request.dto';
import { GetCustomerMembershipPermissionsResponseDto } from '#/modules/membership/get-customer-membership-permissions.response.dto';

export class GetCustomerMembershipPermissionsQuery extends Query<GetCustomerMembershipPermissionsResponseDto> {
  constructor(public readonly input: GetCustomerMembershipPermissionsRequestDto) {
    super();
  }
}
