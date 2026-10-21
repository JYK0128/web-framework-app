import { Command } from '@nestjs/cqrs';

import type { UpdateCustomerMemoRequestDto } from '~/modules/customer/profile/update-customer-memo.request.dto';
import { UpdateCustomerMemoResponseDto } from '~/modules/customer/profile/update-customer-memo.response.dto';

export class UpdateCustomerMemoCommand extends Command<UpdateCustomerMemoResponseDto> {
  constructor(public readonly input: { customerId: string, dto: UpdateCustomerMemoRequestDto }) {
    super();
  }
}
