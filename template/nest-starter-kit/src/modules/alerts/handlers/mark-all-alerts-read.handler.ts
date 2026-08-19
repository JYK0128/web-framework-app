import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert } from '#/entities/alerts/alert.entity';
import { MarkAllAlertsReadCommand } from '#/modules/alerts/commands/mark-all-alerts-read.command';

@CommandHandler(MarkAllAlertsReadCommand)
export class MarkAllAlertsReadHandler implements ICommandHandler<MarkAllAlertsReadCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkAllAlertsReadCommand): Promise<void> {
    const unreadAlerts = await this.em.find(Alert, {
      user: command.userId,
      isRead: false,
    });

    const now = new Date();
    for (const alert of unreadAlerts) {
      alert.isRead = true;
      alert.readAt = now;
      this.em.persist(alert);
    }
  }
}
