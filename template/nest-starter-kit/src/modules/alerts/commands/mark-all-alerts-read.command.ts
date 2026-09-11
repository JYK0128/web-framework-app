import { Command } from '@nestjs/cqrs';

import { type MarkAllAlertsReadRequestDto, type MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';

export class MarkAllAlertsReadCommand extends Command<MarkAllAlertsReadResponseDto> {
  constructor(public readonly input: MarkAllAlertsReadRequestDto) {
    super();
  }
}
