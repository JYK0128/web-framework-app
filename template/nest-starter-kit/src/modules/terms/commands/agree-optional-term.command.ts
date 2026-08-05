import { Command } from '@nestjs/cqrs';

import { AgreeOptionalTermRequestDto } from '#/modules/terms/dto/agree-optional-term.request.dto';
import { AgreeOptionalTermResponseDto } from '#/modules/terms/dto/agree-optional-term.response.dto';

export class AgreeOptionalTermCommand extends Command<AgreeOptionalTermResponseDto> {
  constructor(public readonly input: AgreeOptionalTermRequestDto) { super(); }
}
