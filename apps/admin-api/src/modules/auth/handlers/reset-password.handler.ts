import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { ResetPasswordCommand } from '#/modules/auth/commands';
import { ResetPasswordResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, ResetPasswordResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: ResetPasswordCommand): Promise<ResetPasswordResponseDto> {
    await this.recovery.resetPassword(input.challengeId, input.token, input.newPassword);
    return ResetPasswordResponseDto.fromPlain({ ok: true });
  }
}
