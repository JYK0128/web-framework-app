import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MarkAllAlertsReadCommand } from '#/modules/alerts/commands/mark-all-alerts-read.command';
import { MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';

@CommandHandler(MarkAllAlertsReadCommand)
export class MarkAllAlertsReadHandler implements ICommandHandler<MarkAllAlertsReadCommand, MarkAllAlertsReadResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkAllAlertsReadCommand): Promise<MarkAllAlertsReadResponseDto> {
    const unreadAlerts = await this.identifyUnreadAlerts(command.input.userId);
    this.process(unreadAlerts);
    return { ok: true };
  }

  private async identifyUnreadAlerts(userId: string): Promise<Alert[]> {
    return this.em.find(Alert, {
      user: userId,
      isRead: false,
    });
  }

  private process(unreadAlerts: Alert[]): void {
    const now = new Date();
    for (const alert of unreadAlerts) {
      alert.isRead = true;
      alert.readAt = now;
      this.em.persist(alert);
    }
  }
}
