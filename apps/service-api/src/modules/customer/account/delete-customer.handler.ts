import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';

import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteCustomerCommand } from '#/modules/customer/account/delete-customer.command';
import { DeleteCustomerResponseDto } from '#/modules/customer/account/delete-customer.response.dto';
import { findCustomer, ok } from '#/modules/customer/customer-actions.helpers';

@Injectable()
@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand, DeleteCustomerResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: DeleteCustomerCommand): Promise<DeleteCustomerResponseDto> {
    const customer = await findCustomer(this.em, command.customerId);
    customer.deletedAt = new Date();
    await this.userAuthService.revokeUserTokens?.(customer.id);
    return ok();
  }
}
