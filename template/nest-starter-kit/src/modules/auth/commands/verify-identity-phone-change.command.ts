import type { VerifyIdentityPhoneChangeRequestDto } from '#/modules/auth/dto/verify-identity-phone-change.request.dto';

export class VerifyIdentityPhoneChangeCommand {
  constructor(public readonly input: VerifyIdentityPhoneChangeRequestDto) {}
}
