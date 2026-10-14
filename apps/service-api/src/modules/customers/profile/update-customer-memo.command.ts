import { Command } from '@nestjs/cqrs';

import type { UpdateCustomerMemoRequestDto } from '#/modules/customers/profile/update-customer-memo.request.dto';
import { UpdateCustomerMemoResponseDto } from '#/modules/customers/profile/update-customer-memo.response.dto';

export class UpdateCustomerMemoCommand extends Command<UpdateCustomerMemoResponseDto> {
  constructor(public readonly input: { customerId: string, dto: UpdateCustomerMemoRequestDto }) {
    super();
  }
}
