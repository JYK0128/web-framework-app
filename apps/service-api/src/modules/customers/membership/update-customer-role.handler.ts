import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { findCustomer, ok } from '#/modules/customers/customer-actions.helpers';
import { UpdateCustomerRoleCommand } from '#/modules/customers/membership/update-customer-role.command';
import { UpdateCustomerRoleResponseDto } from '#/modules/customers/membership/update-customer-role.response.dto';

@Injectable()
@CommandHandler(UpdateCustomerRoleCommand)
export class UpdateCustomerRoleHandler implements ICommandHandler<UpdateCustomerRoleCommand, UpdateCustomerRoleResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: UpdateCustomerRoleCommand): Promise<UpdateCustomerRoleResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    const role = await this.em.findOne(Role, { code: command.input.dto.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'CUSTOMER_ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    customer.role = role;
    await this.userAuthService.revokeUserTokens?.(customer.id);
    return ok();
  }
}
