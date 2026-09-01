import { Command } from '@nestjs/cqrs';

import { AccountUnlinkRequestDto } from '#/modules/auth/dto/account-unlink.request.dto';
import { AccountUnlinkResponseDto } from '#/modules/auth/dto/account-unlink.response.dto';

export class AccountUnlinkCommand extends Command<AccountUnlinkResponseDto> {
  constructor(public readonly input: AccountUnlinkRequestDto) { super(); }
}
