import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { ResetPasswordCommand } from '#/modules/auth/commands/reset-password.command';
import { PasswordResetResponseDto } from '#/modules/auth/dto/password-reset.response.dto';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, PasswordResetResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: ResetPasswordCommand): Promise<PasswordResetResponseDto> {
    await this.recovery.resetPassword(input.challengeId, input.token, input.newPassword);
    return PasswordResetResponseDto.fromPlain({ ok: true });
  }
}
