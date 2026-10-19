import { Command } from '@nestjs/cqrs';

import type { SetAgreementsRequestDto, SetAgreementsResponseDto } from '#/modules/terms/interfaces';

export class SetAgreementsCommand extends Command<SetAgreementsResponseDto> {
  constructor(public readonly input: SetAgreementsRequestDto) {
    super();
  }
}
