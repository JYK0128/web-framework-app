import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert } from '#/entities/alerts/alert.entity';
import { MarkAlertReadCommand } from '#/modules/alerts/commands/mark-alert-read.command';

@CommandHandler(MarkAlertReadCommand)
export class MarkAlertReadHandler implements ICommandHandler<MarkAlertReadCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkAlertReadCommand): Promise<void> {
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
    if (!alert.isRead) {
      alert.isRead = true;
      alert.readAt = new Date();
      this.em.persist(alert);
    }
  }
}
