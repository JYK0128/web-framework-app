import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { RequestEmailVerificationCommand } from '#/modules/auth/commands/request-email-verification.command';
import { EmailVerificationRequestResponseDto } from '#/modules/auth/dto/email-verification-request.response.dto';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, EmailVerificationRequestResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestEmailVerificationCommand): Promise<EmailVerificationRequestResponseDto> {
    return EmailVerificationRequestResponseDto.fromPlain(await this.recovery.requestEmailVerification(input.email));
  }
}
