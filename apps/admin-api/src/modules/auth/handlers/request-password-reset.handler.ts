import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { RequestPasswordResetCommand } from '#/modules/auth/commands';
import { RequestPasswordResetResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestPasswordResetCommand): Promise<RequestPasswordResetResponseDto> {
    return RequestPasswordResetResponseDto.fromPlain(await this.recovery.requestPasswordReset(input.email, input.phoneNumber));
  }
}
