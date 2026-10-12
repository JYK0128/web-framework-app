import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { BanCustomerCommand, DeleteCustomerCommand, UnbanCustomerCommand, UpdateCustomerMemoCommand, UpdateCustomerRoleCommand } from '#/modules/internal/commands';
import { CustomerActionResponseDto } from '#/modules/internal/dto';

const ok = () => CustomerActionResponseDto.fromPlain({ ok: true });

@Injectable()
@CommandHandler(BanCustomerCommand)
export class BanCustomerHandler implements ICommandHandler<BanCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: BanCustomerCommand): Promise<CustomerActionResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    if (command.input.dto.expiresAt && command.input.dto.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'CUSTOMER_BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }
    customer.banned = true;
    customer.banReason = command.input.dto.reason?.trim() || null;
    customer.banExpires = command.input.dto.expiresAt ?? null;
    await this.userAuthService.revokeUserTokens?.(customer.id);
    return ok();
  }
}

@Injectable()
@CommandHandler(UnbanCustomerCommand)
export class UnbanCustomerHandler implements ICommandHandler<UnbanCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UnbanCustomerCommand): Promise<CustomerActionResponseDto> {
    const customer = await findCustomer(this.em, command.customerId);
    customer.banned = false;
    customer.banReason = null;
    customer.banExpires = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: DeleteCustomerCommand): Promise<CustomerActionResponseDto> {
    const customer = await findCustomer(this.em, command.customerId);
    customer.deletedAt = new Date();
    await this.userAuthService.revokeUserTokens?.(customer.id);
    return ok();
  }
}

@Injectable()
@CommandHandler(UpdateCustomerRoleCommand)
export class UpdateCustomerRoleHandler implements ICommandHandler<UpdateCustomerRoleCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: UpdateCustomerRoleCommand): Promise<CustomerActionResponseDto> {
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

@Injectable()
@CommandHandler(UpdateCustomerMemoCommand)
export class UpdateCustomerMemoHandler implements ICommandHandler<UpdateCustomerMemoCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateCustomerMemoCommand): Promise<CustomerActionResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    customer.updateMetadata({ memo: command.input.dto.memo.trim() || null });
    return ok();
  }
}

async function findCustomer(em: AppEntityManager, customerId: string): Promise<User> {
  const customer = await em.findOne(User, { id: customerId }, { populate: ['role'], filters: false });
  if (!customer || customer.deletedAt) {
    throw new ApplicationError({ code: 'CUSTOMER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  }
  return customer;
}
