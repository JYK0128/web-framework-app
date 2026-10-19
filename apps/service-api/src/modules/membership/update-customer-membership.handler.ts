import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { normalizePermissions } from '#/modules/membership/customer-membership.helpers';
import { UpdateCustomerMembershipCommand } from '#/modules/membership/update-customer-membership.command';
import { UpdateCustomerMembershipResponseDto } from '#/modules/membership/update-customer-membership.response.dto';

@Injectable()
@CommandHandler(UpdateCustomerMembershipCommand)
export class UpdateCustomerMembershipHandler implements ICommandHandler<UpdateCustomerMembershipCommand, UpdateCustomerMembershipResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}
  async execute(command: UpdateCustomerMembershipCommand): Promise<UpdateCustomerMembershipResponseDto> {
    const role = await this.em.findOne(Role, { id: command.input.membershipId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (command.input.dto.label !== undefined) role.label = command.input.dto.label.trim();
    if (command.input.dto.description !== undefined) role.description = command.input.dto.description.trim() || null;
    role.updatedAt = new Date();
    if (command.input.dto.permissions !== undefined) {
      role.permissions = await normalizePermissions(this.em, command.input.dto.permissions);
      await this.em.flush();
      await this.userAuthService.invalidateRoleTokens?.(role.id);
    }
    return UpdateCustomerMembershipResponseDto.parseEntity(role, await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false }));
  }
}
