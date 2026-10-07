import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { FindIdCommand, RequestEmailVerificationCommand, RequestPasswordResetCommand, ResetPasswordCommand, VerifyEmailCommand } from '#/modules/auth/commands/account-recovery.command';
import { EmailVerificationRequestResponseDto, FindIdResponseDto, PasswordResetRequestResponseDto, PasswordResetResponseDto, VerifyEmailResponseDto } from '#/modules/auth/interfaces/account-recovery.dto';

@Injectable()
@CommandHandler(FindIdCommand)
export class FindIdHandler implements ICommandHandler<FindIdCommand, FindIdResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: FindIdCommand): Promise<FindIdResponseDto> {
    return FindIdResponseDto.fromPlain(await this.recovery.findIds(input.name, input.phoneNumber));
  }
}

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, EmailVerificationRequestResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestEmailVerificationCommand): Promise<EmailVerificationRequestResponseDto> {
    return EmailVerificationRequestResponseDto.fromPlain(await this.recovery.requestEmailVerification(input.email));
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    return VerifyEmailResponseDto.fromPlain(await this.recovery.verifyEmail(input.challengeId, input.token));
  }
}

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, PasswordResetRequestResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: RequestPasswordResetCommand): Promise<PasswordResetRequestResponseDto> {
    return PasswordResetRequestResponseDto.fromPlain(await this.recovery.requestPasswordReset(input.email, input.phoneNumber));
  }
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, PasswordResetResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: ResetPasswordCommand): Promise<PasswordResetResponseDto> {
    return PasswordResetResponseDto.fromPlain(await this.recovery.resetPassword(input.challengeId, input.token, input.newPassword));
  }
}
