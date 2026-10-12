import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { VerifyEmailCommand } from '#/modules/auth/commands';
import { VerifyEmailResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    await this.recovery.verifyEmail(input.challengeId, input.token);
    return VerifyEmailResponseDto.fromPlain({ ok: true });
  }
}
