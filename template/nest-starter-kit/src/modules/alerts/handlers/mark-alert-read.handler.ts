import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MarkAlertReadCommand } from '#/modules/alerts/commands/mark-alert-read.command';
import { MarkAlertReadResponseDto } from '#/modules/alerts/dto';

@CommandHandler(MarkAlertReadCommand)
export class MarkAlertReadHandler implements ICommandHandler<MarkAlertReadCommand, MarkAlertReadResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: MarkAlertReadCommand): Promise<MarkAlertReadResponseDto> {
    const alert = await this.identifyAlert(command.input.alertId, this.sessionContext.requiredUser.id);
    this.verify(alert);
    this.process(alert);
    return { ok: true };
  }

  private verify(alert: Alert): void {
    if (!alert) {
      throw new ApplicationError({ code: 'ALERT_NOT_FOUND', status: 404 });
    }
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
