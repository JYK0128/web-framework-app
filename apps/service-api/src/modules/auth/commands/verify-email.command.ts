import { Command } from '@nestjs/cqrs';

import type { EmailVerificationResponseDto, ResendEmailVerificationRequestDto, ResendEmailVerificationResponseDto, VerifyEmailRequestDto } from '#/modules/auth/dto/registration.dto';

export class VerifyEmailCommand extends Command<EmailVerificationResponseDto> {
  constructor(public readonly input: VerifyEmailRequestDto) { super(); }
}

export class ResendEmailVerificationCommand extends Command<ResendEmailVerificationResponseDto> {
  constructor(public readonly input: ResendEmailVerificationRequestDto) { super(); }
}
