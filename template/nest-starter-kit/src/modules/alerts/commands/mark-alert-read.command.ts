import { Command } from '@nestjs/cqrs';

import type { MarkAlertReadResponseDto } from '#/modules/alerts/dto';

export interface MarkAlertReadPayload {
  alertId: string
  userId: string
}

export class MarkAlertReadCommand extends Command<MarkAlertReadResponseDto> {
  constructor(public readonly input: MarkAlertReadPayload) {
    super();
  }
}
