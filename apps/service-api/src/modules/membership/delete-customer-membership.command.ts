import { Command } from '@nestjs/cqrs';

import { DeleteCustomerMembershipResponseDto } from '#/modules/membership/delete-customer-membership.response.dto';

export class DeleteCustomerMembershipCommand extends Command<DeleteCustomerMembershipResponseDto> {
  constructor(public readonly membershipId: string) {
    super();
  }
}
