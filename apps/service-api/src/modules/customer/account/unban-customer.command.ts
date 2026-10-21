import { Command } from '@nestjs/cqrs';

import { UnbanCustomerResponseDto } from '~/modules/customer/account/unban-customer.response.dto';

export class UnbanCustomerCommand extends Command<UnbanCustomerResponseDto> {
  constructor(public readonly customerId: string) {
    super();
  }
}
