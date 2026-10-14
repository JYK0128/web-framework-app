import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { UnbanCustomerCommand } from '#/modules/customer/account/unban-customer.command';
import { UnbanCustomerResponseDto } from '#/modules/customer/account/unban-customer.response.dto';
import { findCustomer, ok } from '#/modules/customer/customer-actions.helpers';

@Injectable()
@CommandHandler(UnbanCustomerCommand)
export class UnbanCustomerHandler implements ICommandHandler<UnbanCustomerCommand, UnbanCustomerResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UnbanCustomerCommand): Promise<UnbanCustomerResponseDto> {
    const customer = await findCustomer(this.em, command.customerId);
    customer.banned = false;
    customer.banReason = null;
    customer.banExpires = null;
    return ok();
  }
}
