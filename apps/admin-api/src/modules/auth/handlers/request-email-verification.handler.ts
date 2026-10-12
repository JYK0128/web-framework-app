import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { RequestEmailVerificationCommand } from '#/modules/auth/commands/request-email-verification.command';
import { RequestEmailVerificationResponseDto } from '#/modules/auth/dto/request-email-verification.response.dto';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    return RequestEmailVerificationResponseDto.fromPlain(await this.recovery.requestEmailVerification(input.email));
  }
}
