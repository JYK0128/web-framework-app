import { Command } from '@nestjs/cqrs';

import type { AlertType } from '#/entities/alerts/alert.entity';
import type { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';

export interface CreateAlertPayload {
  userId: string
  type: AlertType
  title: string
  content: string
  linkUrl?: string | null
}

export class CreateAlertCommand extends Command<AlertItemDto> {
  constructor(public readonly input: CreateAlertPayload) {
    super();
  }
}
