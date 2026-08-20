import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert } from '#/entities/alerts/alert.entity';
import { DeleteAlertCommand } from '#/modules/alerts/commands/delete-alert.command';

@CommandHandler(DeleteAlertCommand)
export class DeleteAlertHandler implements ICommandHandler<DeleteAlertCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteAlertCommand): Promise<void> {
    const alert = await this.identifyAlert(command.alertId, command.userId);
    this.process(alert);
  }

  private async identifyAlert(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.em.findOne(Alert, {
      id: alertId,
      user: userId,
    });
    if (!alert) {
      throw new ApplicationError({ code: 'ALERT_NOT_FOUND', status: 404 });
    }
    return alert;
  }

  private process(alert: Alert): void {
    this.em.remove(alert);
  }
}
