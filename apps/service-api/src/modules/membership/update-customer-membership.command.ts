import { Command } from '@nestjs/cqrs';

import { type UpdateCustomerMembershipRequestDto } from '~/modules/membership/update-customer-membership.request.dto';
import { UpdateCustomerMembershipResponseDto } from '~/modules/membership/update-customer-membership.response.dto';

export class UpdateCustomerMembershipCommand extends Command<UpdateCustomerMembershipResponseDto> {
  constructor(public readonly input: { membershipId: string, dto: UpdateCustomerMembershipRequestDto }) {
    super();
  }
}
