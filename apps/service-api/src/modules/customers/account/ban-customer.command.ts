import { Command } from '@nestjs/cqrs';

import type { BanCustomerRequestDto } from '#/modules/customers/account/ban-customer.request.dto';
import { BanCustomerResponseDto } from '#/modules/customers/account/ban-customer.response.dto';

export class BanCustomerCommand extends Command<BanCustomerResponseDto> {
  constructor(public readonly input: { customerId: string, dto: BanCustomerRequestDto }) {
    super();
  }
}
