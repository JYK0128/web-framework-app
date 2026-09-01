import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Alert } from '#/entities/alerts/alert.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteAlertCommand } from '#/modules/alerts/commands/delete-alert.command';
import { DeleteAlertResponseDto } from '#/modules/alerts/dto';

@CommandHandler(DeleteAlertCommand)
export class DeleteAlertHandler implements ICommandHandler<DeleteAlertCommand, DeleteAlertResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteAlertCommand): Promise<DeleteAlertResponseDto> {
    const alert = await this.identifyAlert(command.input.alertId, command.input.userId);
    this.process(alert);
    return { ok: true };
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
