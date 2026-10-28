import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { findCustomer } from '~/modules/customer/customer.helper';
import { UpdateCustomerMemoCommand } from '~/modules/customer/profile/update-customer-memo.command';
import { UpdateCustomerMemoResponseDto } from '~/modules/customer/profile/update-customer-memo.response.dto';

@Injectable()
@CommandHandler(UpdateCustomerMemoCommand)
export class UpdateCustomerMemoHandler implements ICommandHandler<UpdateCustomerMemoCommand, UpdateCustomerMemoResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateCustomerMemoCommand): Promise<UpdateCustomerMemoResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    customer.updateMetadata({ memo: command.input.dto.memo.trim() || null });
    return UpdateCustomerMemoResponseDto.ok();
  }
}
