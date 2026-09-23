import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { BanCustomerCommand, DeleteCustomerCommand, UnbanCustomerCommand, UpdateCustomerRoleCommand } from '#/modules/internal/commands';
import { CustomerActionResponseDto } from '#/modules/internal/dto';

const ok = () => CustomerActionResponseDto.fromPlain({ success: true });

@Injectable()
@CommandHandler(BanCustomerCommand)
export class BanCustomerHandler implements ICommandHandler<BanCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: BanCustomerCommand): Promise<CustomerActionResponseDto> {
    const user = await findCustomer(this.em, command.input.customerId);
    if (command.input.dto.expiresAt && command.input.dto.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'CUSTOMER_BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST, message: '정지 만료일은 현재보다 미래여야 합니다.' });
    }
    user.banned = true;
    user.banReason = command.input.dto.reason?.trim() || null;
    user.banExpires = command.input.dto.expiresAt ?? null;
    return ok();
  }
}

@Injectable()
@CommandHandler(UnbanCustomerCommand)
export class UnbanCustomerHandler implements ICommandHandler<UnbanCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UnbanCustomerCommand): Promise<CustomerActionResponseDto> {
    const user = await findCustomer(this.em, command.customerId);
    user.banned = false;
    user.banReason = null;
    user.banExpires = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteCustomerCommand): Promise<CustomerActionResponseDto> {
    const user = await findCustomer(this.em, command.customerId);
    user.deletedAt = new Date();
    return ok();
  }
}

@Injectable()
@CommandHandler(UpdateCustomerRoleCommand)
export class UpdateCustomerRoleHandler implements ICommandHandler<UpdateCustomerRoleCommand, CustomerActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateCustomerRoleCommand): Promise<CustomerActionResponseDto> {
    const user = await findCustomer(this.em, command.input.customerId);
    const role = await this.em.findOne(Role, { code: command.input.dto.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'CUSTOMER_ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '고객 멤버십 역할을 찾을 수 없습니다.' });
    }
    user.role = role;
    return ok();
  }
}

async function findCustomer(em: AppEntityManager, customerId: string): Promise<User> {
  const user = await em.findOne(User, { id: customerId }, { populate: ['role'], filters: false });
  if (!user || user.deletedAt) {
    throw new ApplicationError({ code: 'CUSTOMER_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '고객 정보를 찾을 수 없습니다.' });
  }
  return user;
}
