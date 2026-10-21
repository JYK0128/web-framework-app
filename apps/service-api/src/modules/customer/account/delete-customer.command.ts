import { Command } from '@nestjs/cqrs';

import { DeleteCustomerResponseDto } from '~/modules/customer/account/delete-customer.response.dto';

export class DeleteCustomerCommand extends Command<DeleteCustomerResponseDto> {
  constructor(public readonly customerId: string) {
    super();
  }
}
