import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findCustomer, ok } from '#/modules/customers/customer-actions.helpers';
import { UpdateCustomerMemoCommand } from '#/modules/customers/profile/update-customer-memo.command';
import { UpdateCustomerMemoResponseDto } from '#/modules/customers/profile/update-customer-memo.response.dto';

@Injectable()
@CommandHandler(UpdateCustomerMemoCommand)
export class UpdateCustomerMemoHandler implements ICommandHandler<UpdateCustomerMemoCommand, UpdateCustomerMemoResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateCustomerMemoCommand): Promise<UpdateCustomerMemoResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    customer.updateMetadata({ memo: command.input.dto.memo.trim() || null });
    return ok();
  }
}
