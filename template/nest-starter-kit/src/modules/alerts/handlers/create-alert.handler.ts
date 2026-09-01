import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Alert } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AlertsGateway } from '#/modules/alerts/alerts.gateway';
import { CreateAlertCommand } from '#/modules/alerts/commands/create-alert.command';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';

@Injectable()
@CommandHandler(CreateAlertCommand)
export class CreateAlertHandler implements ICommandHandler<CreateAlertCommand, AlertItemDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  async execute(command: CreateAlertCommand): Promise<AlertItemDto> {
    const user = await this.identifyUser(command.input.userId);

    return this.process(user, command.input);
  }

  private async identifyUser(userId: string): Promise<User> {
    const user = await this.em.findOne(User, { id: userId, deletedAt: null });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private async process(user: User, input: CreateAlertCommand['input']): Promise<AlertItemDto> {
    const alert = this.em.create(Alert, {
      user,
      type: input.type,
      title: input.title,
      content: input.content,
      linkUrl: input.linkUrl ?? null,
      isRead: false,
    });
    this.em.persist(alert);

    const dto = new AlertItemDto(alert);
    await this.alertsGateway.sendAlertToUser(input.userId, dto);
    return dto;
  }
}
