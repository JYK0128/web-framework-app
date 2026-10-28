import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';
import { Role } from '~/core/database/entities/auth.extensions';
import { DeleteCustomerMembershipCommand } from '~/modules/membership/delete-customer-membership.command';
import { DeleteCustomerMembershipResponseDto } from '~/modules/membership/delete-customer-membership.response.dto';

@Injectable()
@CommandHandler(DeleteCustomerMembershipCommand)
export class DeleteCustomerMembershipHandler implements ICommandHandler<DeleteCustomerMembershipCommand, DeleteCustomerMembershipResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: DeleteCustomerMembershipCommand): Promise<DeleteCustomerMembershipResponseDto> {
    const role = await this.em.findOne(Role, { id: command.membershipId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (role.isSystem) throw new ApplicationError({ code: 'SYSTEM_CUSTOMER_MEMBERSHIP_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    if (await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false })) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_IN_USE', status: HttpStatus.CONFLICT });
    role.deletedAt = new Date();
    return DeleteCustomerMembershipResponseDto.parseEntity(role);
  }
}
