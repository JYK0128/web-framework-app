import { Command } from '@nestjs/cqrs';

import { SetAgreementsRequestDto } from '#/modules/terms/dto/set-agreements.request.dto';
import { SetAgreementsResponseDto } from '#/modules/terms/dto/set-agreements.response.dto';

export class SetAgreementsCommand extends Command<SetAgreementsResponseDto> {
  constructor(public readonly input: SetAgreementsRequestDto) { super(); }
}
