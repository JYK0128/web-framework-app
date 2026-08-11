import { Command } from '@nestjs/cqrs';

import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class Verify2FAChallengeCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: { token: string, code: string }) { super(); }
}
