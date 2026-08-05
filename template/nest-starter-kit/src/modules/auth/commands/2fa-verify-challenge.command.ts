import { Command } from '@nestjs/cqrs';

import { Verify2FAChallengeRequestDto } from '#/modules/auth/dto/2fa-verify-challenge.request.dto';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class Verify2FAChallengeCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: Verify2FAChallengeRequestDto) { super(); }
}
