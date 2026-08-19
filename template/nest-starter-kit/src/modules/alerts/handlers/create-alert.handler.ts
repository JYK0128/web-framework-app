import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { AlertsGateway } from '#/modules/alerts/alerts.gateway';
import { CreateAlertCommand } from '#/modules/alerts/commands/create-alert.command';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';

@CommandHandler(CreateAlertCommand)
export class CreateAlertHandler implements ICommandHandler<CreateAlertCommand, AlertItemDto | null> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  async execute(command: CreateAlertCommand): Promise<AlertItemDto | null> {
    const user = await this.em.findOne(User, { id: command.userId, deletedAt: null });
    if (!user) return null;

    const alert = this.em.create(Alert, {
      user,
      type: command.type,
      title: command.title,
      content: command.content,
      linkUrl: command.linkUrl ?? null,
      isRead: false,
    });
    this.em.persist(alert);

    const dto = new AlertItemDto(alert);
    this.alertsGateway.sendAlertToUser(command.userId, dto);
    return dto;
  }
}
