import { Command } from '@nestjs/cqrs';

import type { DeleteAlertResponseDto } from '#/modules/alerts/dto';

export interface DeleteAlertPayload {
  alertId: string
  userId: string
}

export class DeleteAlertCommand extends Command<DeleteAlertResponseDto> {
  constructor(public readonly input: DeleteAlertPayload) {
    super();
  }
}
