import { Command } from '@nestjs/cqrs';

import type { EmailVerificationRequestDto } from '#/modules/auth/dto/email-verification.request.dto';
import type { EmailVerificationRequestResponseDto } from '#/modules/auth/dto/email-verification-request.response.dto';

export class RequestEmailVerificationCommand extends Command<EmailVerificationRequestResponseDto> {
  constructor(public readonly input: EmailVerificationRequestDto) { super(); }
}
