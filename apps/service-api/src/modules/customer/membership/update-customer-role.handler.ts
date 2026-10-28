import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '~/core/database/entities/auth.extensions';
import { findCustomer } from '~/modules/customer/customer.helper';
import { UpdateCustomerRoleCommand } from '~/modules/customer/membership/update-customer-role.command';
import { UpdateCustomerRoleResponseDto } from '~/modules/customer/membership/update-customer-role.response.dto';

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
    return UpdateCustomerRoleResponseDto.ok();
  }
}
