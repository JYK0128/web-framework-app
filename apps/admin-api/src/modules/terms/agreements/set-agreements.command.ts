import { Command } from '@nestjs/cqrs';

import type { SetAgreementsRequestDto } from '#/modules/terms/agreements/set-agreements.request.dto';
import type { SetAgreementsResponseDto } from '#/modules/terms/agreements/set-agreements.response.dto';

export class SetAgreementsCommand extends Command<SetAgreementsResponseDto> {
  constructor(public readonly input: SetAgreementsRequestDto) {
    super();
  }
}
