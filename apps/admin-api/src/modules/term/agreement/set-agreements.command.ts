import { Command } from '@nestjs/cqrs';

import type { SetAgreementsRequestDto } from '#/modules/term/agreement/set-agreements.request.dto';
import type { SetAgreementsResponseDto } from '#/modules/term/agreement/set-agreements.response.dto';

export class SetAgreementsCommand extends Command<SetAgreementsResponseDto> {
  constructor(public readonly input: SetAgreementsRequestDto) {
    super();
  }
}
