import { Command } from '@nestjs/cqrs';

import { MarkAllAlertsReadRequestDto, type MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';

export class MarkAllAlertsReadCommand extends Command<MarkAllAlertsReadResponseDto> {
  constructor(public readonly input: MarkAllAlertsReadRequestDto = new MarkAllAlertsReadRequestDto()) {
    super();
  }
}
