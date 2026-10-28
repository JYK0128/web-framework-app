import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { BanCustomerCommand } from '~/modules/customer/account/ban-customer.command';
import { BanCustomerResponseDto } from '~/modules/customer/account/ban-customer.response.dto';
import { findCustomer } from '~/modules/customer/customer.helper';

@Injectable()
@CommandHandler(BanCustomerCommand)
export class BanCustomerHandler implements ICommandHandler<BanCustomerCommand, BanCustomerResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: BanCustomerCommand): Promise<BanCustomerResponseDto> {
    const customer = await findCustomer(this.em, command.input.customerId);
    if (command.input.dto.expiresAt && command.input.dto.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'CUSTOMER_BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }
    customer.banned = true;
    customer.banReason = command.input.dto.reason?.trim() || null;
    customer.banExpires = command.input.dto.expiresAt ?? null;
    await this.userAuthService.revokeUserTokens?.(customer.id);
    return BanCustomerResponseDto.ok();
  }
}
