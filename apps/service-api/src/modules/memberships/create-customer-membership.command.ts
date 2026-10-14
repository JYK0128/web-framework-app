import { Command } from '@nestjs/cqrs';

import { type CreateCustomerMembershipRequestDto } from '#/modules/memberships/create-customer-membership.request.dto';
import { CreateCustomerMembershipResponseDto } from '#/modules/memberships/create-customer-membership.response.dto';

export class CreateCustomerMembershipCommand extends Command<CreateCustomerMembershipResponseDto> {
  constructor(public readonly input: CreateCustomerMembershipRequestDto) {
    super();
  }
}
