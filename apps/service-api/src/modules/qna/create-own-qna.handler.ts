import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { AdminQnaCreatedEvent } from '@pkg/server-core/event-broker/events';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';

import { User } from '#/core/database/entities/auth';
import { Qna } from '#/core/database/entities/qna';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateOwnQnaCommand } from '#/modules/qna/create-own-qna.command';
import { CreateQnaResponseDto } from '#/modules/qna/create-qna.response.dto';
import { QnaCreatedEvent } from '#/modules/qna/qna-created.event';

@CommandHandler(CreateOwnQnaCommand)
export class CreateOwnQnaHandler implements ICommandHandler<CreateOwnQnaCommand, CreateQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly eventBus: EventBus, private readonly eventBroker: EventBroker) {}
  async execute({ input }: CreateOwnQnaCommand): Promise<CreateQnaResponseDto> {
    const principal = this.principal.ensureUser();
    const user = await this.em.findOneOrFail(User, { id: principal.id }, { populate: ['profile'] });
    const qna = this.em.create(Qna, {
      ...input,
      user,
      priority: input.priority ?? QnaPriority.NORMAL,
      status: QnaStatus.OPEN,
    });
    this.em.persist(qna);
    await this.em.flush();
    await this.eventBroker.publish(new AdminQnaCreatedEvent(qna.id, qna.title, qna.priority, qna.createdAt.toISOString()));
    this.eventBus.publish(new QnaCreatedEvent(qna.id, qna.priority));
    return CreateQnaResponseDto.parseEntity(qna);
  }
}
