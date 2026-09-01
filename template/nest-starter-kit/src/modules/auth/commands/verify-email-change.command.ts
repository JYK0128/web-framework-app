import type { VerifyEmailChangeRequestDto } from '#/modules/auth/dto/verify-email-change.request.dto';

export class VerifyEmailChangeCommand {
  constructor(public readonly input: VerifyEmailChangeRequestDto) {}
}
