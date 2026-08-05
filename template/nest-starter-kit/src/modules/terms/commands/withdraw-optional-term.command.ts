import { Command } from '@nestjs/cqrs';

import { WithdrawOptionalTermRequestDto } from '#/modules/terms/dto/withdraw-optional-term.request.dto';
import { WithdrawOptionalTermResponseDto } from '#/modules/terms/dto/withdraw-optional-term.response.dto';

export class WithdrawOptionalTermCommand extends Command<WithdrawOptionalTermResponseDto> {
  constructor(public readonly input: WithdrawOptionalTermRequestDto) { super(); }
}
