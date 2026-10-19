import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateCustomerMembershipCommand } from '#/modules/membership/create-customer-membership.command';
import { CreateCustomerMembershipResponseDto } from '#/modules/membership/create-customer-membership.response.dto';
import { normalizePermissions } from '#/modules/membership/customer-membership.helpers';

@Injectable()
@CommandHandler(CreateCustomerMembershipCommand)
export class CreateCustomerMembershipHandler implements ICommandHandler<CreateCustomerMembershipCommand, CreateCustomerMembershipResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: CreateCustomerMembershipCommand): Promise<CreateCustomerMembershipResponseDto> {
    const input = command.input;
    const code = input.code.trim().toLowerCase();
    if (await this.em.findOne(Role, { code }, { filters: false })) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    const role = this.em.create(Role, { code, label: input.label.trim(), description: input.description?.trim() || null, isSystem: false, permissions: await normalizePermissions(this.em, input.permissions) });
    this.em.persist(role);
    return CreateCustomerMembershipResponseDto.parseEntity(role, await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false }));
  }
}
