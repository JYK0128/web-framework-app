import type { VerifyPhoneChangeRequestDto } from '#/modules/auth/dto/verify-phone-change.request.dto';

export class VerifyPhoneChangeCommand {
  constructor(public readonly input: VerifyPhoneChangeRequestDto) {}
}
