import { Command } from '@nestjs/cqrs';

import { AccountLinkRequestDto } from '#/modules/auth/dto/account-link.request.dto';
import { AccountLinkResponseDto } from '#/modules/auth/dto/account-link.response.dto';

export class AccountLinkCommand extends Command<AccountLinkResponseDto> {
  constructor(public readonly input: AccountLinkRequestDto) { super(); }
}
