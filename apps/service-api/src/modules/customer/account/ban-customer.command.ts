import { Command } from '@nestjs/cqrs';

import type { BanCustomerRequestDto } from '~/modules/customer/account/ban-customer.request.dto';
import { BanCustomerResponseDto } from '~/modules/customer/account/ban-customer.response.dto';

export class BanCustomerCommand extends Command<BanCustomerResponseDto> {
  constructor(public readonly input: { customerId: string, dto: BanCustomerRequestDto }) {
    super();
  }
}
