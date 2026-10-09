import { Command } from '@nestjs/cqrs';

import type { EmailVerificationResponseDto, RequestEmailVerificationRequestDto, RequestEmailVerificationResponseDto, VerifyEmailRequestDto } from '#/modules/auth/dto/registration.dto';

export class VerifyEmailCommand extends Command<EmailVerificationResponseDto> {
  constructor(public readonly input: VerifyEmailRequestDto) { super(); }
}

export class RequestEmailVerificationCommand extends Command<RequestEmailVerificationResponseDto> {
  constructor(public readonly input: RequestEmailVerificationRequestDto) { super(); }
}
