import { Command } from '@nestjs/cqrs';

import type { UpdateCustomerRoleRequestDto } from '#/modules/customer/membership/update-customer-role.request.dto';
import { UpdateCustomerRoleResponseDto } from '#/modules/customer/membership/update-customer-role.response.dto';

export class UpdateCustomerRoleCommand extends Command<UpdateCustomerRoleResponseDto> {
  constructor(public readonly input: { customerId: string, dto: UpdateCustomerRoleRequestDto }) {
    super();
  }
}
