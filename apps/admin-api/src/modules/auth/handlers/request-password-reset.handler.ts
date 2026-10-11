import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { RequestPasswordResetCommand } from '#/modules/auth/commands/request-password-reset.command';
import { PasswordResetRequestResponseDto } from '#/modules/auth/dto/password-reset-request.response.dto';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, PasswordResetRequestResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestPasswordResetCommand): Promise<PasswordResetRequestResponseDto> {
    return PasswordResetRequestResponseDto.fromPlain(await this.recovery.requestPasswordReset(input.email, input.phoneNumber));
  }
}
