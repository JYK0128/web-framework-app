import { HttpStatus, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { Qna, QnaPriority, QnaStatus } from '#/entities/qna/qna.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { CreateQnaRequestDto, GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaPageResponseDto, UpdateQnaRequestDto } from './dto/qna.dto';
import { QnaCreatedEvent } from './qna-created.event';

@Injectable()
export class QnaService {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly eventBus: EventBus) {}
  async list(input: GetQnaRequestDto, mine = true): Promise<QnaPageResponseDto> {
    const where = this.scopedQuery(input.toFilterQuery(), mine);
    const result = await this.em.findByPage(Qna, where, { ...input.toPageOptions(), populate: ['user.profile', 'assignee.profile'] });
    return QnaPageResponseDto.fromPlain({ ...result, items: result.items.map((item) => QnaItemDto.from(item)) });
  }

  async get(id: string, mine = true): Promise<QnaItemDto> {
    const qna = await this.findEntity(id, mine);
    return QnaItemDto.from(qna);
  }

  async create(input: CreateQnaRequestDto): Promise<QnaItemDto> {
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
    this.eventBus.publish(new QnaCreatedEvent(qna.id, qna.priority));
    return QnaItemDto.from(qna);
  }

  async update(id: string, input: UpdateQnaRequestDto, mine = false): Promise<QnaItemDto> {
    const qna = await this.findEntity(id, mine);
    const { assigneeId, ...fields } = input;
    Object.assign(qna, fields);
    if (assigneeId !== undefined) {
      qna.assignee = assigneeId ? this.em.getReference(User, assigneeId) : null;
    }
    if (input.answer !== undefined && qna.status === QnaStatus.OPEN) qna.status = QnaStatus.ANSWERED;
    return QnaItemDto.from(qna);
  }

  async remove(id: string, mine = false): Promise<QnaActionResponseDto> {
    const qna = await this.findEntity(id, mine);
    qna.deletedAt = new Date();
    return { ok: true };
  }

  private async findEntity(id: string, mine: boolean): Promise<Qna> {
    const user = mine ? this.principal.ensureUser() : null;
    const qna = await this.em.findOne(Qna, this.scopedQuery({ id }, mine, user?.id), { populate: ['user.profile', 'assignee.profile'] });
    if (!qna) throw new ApplicationError({ code: 'QNA_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: 'Q&A를 찾을 수 없습니다.' });
    return qna;
  }

  private scopedQuery(query: object, mine: boolean, userId?: string) {
    return mine ? { $and: [query, { user: userId }] } : query;
  }
}
