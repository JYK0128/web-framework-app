import { Command } from '@nestjs/cqrs';

import { TermsAgreeRequestDto } from '#/modules/auth/dto/terms-agree.request.dto';
import type { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class TermsAgreeCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: TermsAgreeRequestDto) { super(); }
}
