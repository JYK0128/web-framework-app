import { Command } from '@nestjs/cqrs';

import type { EmailVerificationRequestDto, EmailVerificationRequestResponseDto, FindIdRequestDto, FindIdResponseDto, PasswordResetRequestDto, PasswordResetRequestResponseDto, PasswordResetResponseDto, ResetPasswordDto, VerifyEmailDto, VerifyEmailResponseDto } from '#/modules/auth/interfaces/account-recovery.dto';

export class FindIdCommand extends Command<FindIdResponseDto> { constructor(public readonly input: FindIdRequestDto) { super(); } }
export class RequestEmailVerificationCommand extends Command<EmailVerificationRequestResponseDto> { constructor(public readonly input: EmailVerificationRequestDto) { super(); } }
export class VerifyEmailCommand extends Command<VerifyEmailResponseDto> { constructor(public readonly input: VerifyEmailDto) { super(); } }
export class RequestPasswordResetCommand extends Command<PasswordResetRequestResponseDto> { constructor(public readonly input: PasswordResetRequestDto) { super(); } }
export class ResetPasswordCommand extends Command<PasswordResetResponseDto> { constructor(public readonly input: ResetPasswordDto) { super(); } }
