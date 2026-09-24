import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { ALL_SERVICE_PERMISSIONS } from '#/common/auth/permissions';
import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { CreateCustomerMembershipCommand, DeleteCustomerMembershipCommand, GetCustomerMembershipPermissionsQuery, GetCustomerMembershipsQuery, UpdateCustomerMembershipCommand } from '../commands/customer-membership.commands';
import { CustomerMembershipItemDto, CustomerMembershipListResponseDto, CustomerMembershipPermissionListResponseDto, DeleteCustomerMembershipResponseDto } from '../dto/customer-membership.dto';

const item = async (em: AppEntityManager, role: Role): Promise<CustomerMembershipItemDto> => CustomerMembershipItemDto.fromPlain({
  id: role.id, code: role.code, label: role.label, description: role.description, isSystem: role.isSystem,
  customerCount: await em.count(User, { role: role.id, deletedAt: null }, { filters: false }), permissions: role.permissions ?? [],
});

@Injectable()
@QueryHandler(GetCustomerMembershipsQuery)
export class GetCustomerMembershipsHandler implements IQueryHandler<GetCustomerMembershipsQuery, CustomerMembershipListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(): Promise<CustomerMembershipListResponseDto> {
    const roles = await this.em.find(Role, {}, { orderBy: { code: 'ASC' } });
    return CustomerMembershipListResponseDto.fromPlain({ items: await Promise.all(roles.map((role) => item(this.em, role))) });
  }
}

@Injectable()
@QueryHandler(GetCustomerMembershipPermissionsQuery)
export class GetCustomerMembershipPermissionsHandler implements IQueryHandler<GetCustomerMembershipPermissionsQuery, CustomerMembershipPermissionListResponseDto> {
  async execute(): Promise<CustomerMembershipPermissionListResponseDto> {
    return CustomerMembershipPermissionListResponseDto.fromPlain({ items: ALL_SERVICE_PERMISSIONS });
  }
}

@Injectable()
@CommandHandler(CreateCustomerMembershipCommand)
export class CreateCustomerMembershipHandler implements ICommandHandler<CreateCustomerMembershipCommand, CustomerMembershipItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: CreateCustomerMembershipCommand): Promise<CustomerMembershipItemDto> {
    const input = command.input;
    const code = input.code.trim().toLowerCase();
    if (await this.em.findOne(Role, { code }, { filters: false })) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    const role = this.em.create(Role, { code, label: input.label.trim(), description: input.description?.trim() || null, isSystem: false, permissions: normalizePermissions(input.permissions) });
    this.em.persist(role);
    return item(this.em, role);
  }
}

@Injectable()
@CommandHandler(UpdateCustomerMembershipCommand)
export class UpdateCustomerMembershipHandler implements ICommandHandler<UpdateCustomerMembershipCommand, CustomerMembershipItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: UpdateCustomerMembershipCommand): Promise<CustomerMembershipItemDto> {
    const role = await this.em.findOne(Role, { id: command.input.membershipId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (command.input.dto.label !== undefined) role.label = command.input.dto.label.trim();
    if (command.input.dto.description !== undefined) role.description = command.input.dto.description.trim() || null;
    if (command.input.dto.permissions !== undefined) role.permissions = normalizePermissions(command.input.dto.permissions);
    role.updatedAt = new Date();
    return item(this.em, role);
  }
}

function normalizePermissions(permissions?: string[]): string[] {
  const known = new Set(ALL_SERVICE_PERMISSIONS.map((permission) => permission.code));
  const normalized = [...new Set((permissions ?? []).map((permission) => permission.trim().toLowerCase()).filter(Boolean))];
  const invalid = normalized.filter((permission) => !known.has(permission));
  if (invalid.length > 0) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_PERMISSIONS_INVALID', status: HttpStatus.BAD_REQUEST, details: { permissions: invalid } });
  return normalized;
}

@Injectable()
@CommandHandler(DeleteCustomerMembershipCommand)
export class DeleteCustomerMembershipHandler implements ICommandHandler<DeleteCustomerMembershipCommand, DeleteCustomerMembershipResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: DeleteCustomerMembershipCommand): Promise<DeleteCustomerMembershipResponseDto> {
    const role = await this.em.findOne(Role, { id: command.membershipId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (role.isSystem) throw new ApplicationError({ code: 'SYSTEM_CUSTOMER_MEMBERSHIP_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    if (await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false })) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_IN_USE', status: HttpStatus.CONFLICT, message: '사용 중인 멤버십은 삭제할 수 없습니다.' });
    role.deletedAt = new Date();
    return { id: role.id, deleted: true };
  }
}
