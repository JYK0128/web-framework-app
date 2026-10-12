import { Command } from '@nestjs/cqrs';

import type { SetAgreementsRequestDto, SetAgreementsResponseDto } from '#/modules/terms';

export class SetAgreementsCommand extends Command<SetAgreementsResponseDto> {
  constructor(public readonly input: SetAgreementsRequestDto) {
    super();
  }
}
