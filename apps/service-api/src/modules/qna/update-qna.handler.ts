import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { UserNotificationCreatedEvent } from '@pkg/server-core/event-broker/events';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { QnaStatus } from '@pkg/shared/constants';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { findQna } from '#/modules/qna/qna.helpers';
import { UpdateQnaCommand } from '#/modules/qna/update-qna.command';
import { UpdateQnaResponseDto } from '#/modules/qna/update-qna.response.dto';

@CommandHandler(UpdateQnaCommand)
export class UpdateQnaHandler implements ICommandHandler<UpdateQnaCommand, UpdateQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly eventBroker: EventBroker) {}
  async execute({ input }: UpdateQnaCommand): Promise<UpdateQnaResponseDto> {
    const id = input.qnaId;
    const dto = input.dto;
    const qna = await findQna(this.em, this.principal, id, false);
    const previousAnswer = qna.answer ?? null;
    const { assigneeId, ...fields } = dto;
    Object.assign(qna, fields);
    if (assigneeId !== undefined) {
      qna.assignee = assigneeId ? this.em.getReference(User, assigneeId) : null;
    }
    if (dto.answer !== undefined && qna.status === QnaStatus.OPEN) qna.status = QnaStatus.ANSWERED;
    await this.em.flush();
    if (dto.answer?.trim() && dto.answer !== previousAnswer) {
      const user = qna.user;
      const userId = typeof user === 'string' ? user : user.id;
      await this.eventBroker.publish(new UserNotificationCreatedEvent(userId, {
        id: qna.id,
        kind: 'qna.answer',
        qnaId: qna.id,
        questionTitle: qna.title,
        message: dto.answer,
        createdAt: new Date().toISOString(),
      }));
    }
    return UpdateQnaResponseDto.parseEntity(qna);
  }
}
