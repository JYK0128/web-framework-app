import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert } from '#/entities/alerts/alert.entity';
import { DeleteAlertCommand } from '#/modules/alerts/commands/delete-alert.command';

@CommandHandler(DeleteAlertCommand)
export class DeleteAlertHandler implements ICommandHandler<DeleteAlertCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteAlertCommand): Promise<void> {
    const alert = await this.em.findOne(Alert, {
      id: command.alertId,
      user: command.userId,
    });
    if (!alert) {
      throw new ApplicationError({ code: 'ALERT_NOT_FOUND', status: 404 });
    }

    this.em.remove(alert);
  }
}
