import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { Qna, QnaPriority, QnaStatus } from '#/entities/qna/qna.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { CreateQnaRequestDto, GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaListResponseDto, UpdateQnaRequestDto } from './dto/qna.dto';

@Injectable()
export class QnaService {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async list(input: GetQnaRequestDto, mine = true): Promise<QnaListResponseDto> {
    const where = this.scopedQuery(input.toFilterQuery(), mine);
    const result = await this.em.findByPage(Qna, where, { ...input.toPageOptions(), populate: ['user', 'assignee'] });
    return QnaListResponseDto.fromPlain({ ...result, items: result.items.map((item) => this.toDto(item)) });
  }

  async get(id: string, mine = true): Promise<QnaItemDto> {
    const qna = await this.findEntity(id, mine);
    return this.toDto(qna);
  }

  async create(input: CreateQnaRequestDto): Promise<QnaItemDto> {
    const principal = this.principal.ensureUser();
    const user = await this.em.findOneOrFail(User, { id: principal.id });
    const qna = this.em.create(Qna, {
      ...input,
      user,
      priority: input.priority ?? QnaPriority.NORMAL,
      status: QnaStatus.OPEN,
    });
    this.em.persist(qna);
    return this.toDto(qna);
  }

  async update(id: string, input: UpdateQnaRequestDto, mine = false): Promise<QnaItemDto> {
    const qna = await this.findEntity(id, mine);
    const { assigneeId, ...fields } = input;
    Object.assign(qna, fields);
    if (assigneeId !== undefined) {
      qna.assignee = assigneeId ? this.em.getReference(User, assigneeId) : null;
    }
    if (input.answer !== undefined && qna.status === QnaStatus.OPEN) qna.status = QnaStatus.ANSWERED;
    return this.toDto(qna);
  }

  async remove(id: string, mine = false): Promise<QnaActionResponseDto> {
    const qna = await this.findEntity(id, mine);
    qna.deletedAt = new Date();
    return { success: true };
  }

  private async findEntity(id: string, mine: boolean): Promise<Qna> {
    const user = mine ? this.principal.ensureUser() : null;
    const qna = await this.em.findOne(Qna, this.scopedQuery({ id }, mine, user?.id), { populate: ['user', 'assignee'] });
    if (!qna) throw new ApplicationError({ code: 'QNA_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: 'Q&A를 찾을 수 없습니다.' });
    return qna;
  }

  private scopedQuery(query: object, mine: boolean, userId?: string) {
    return mine ? { $and: [query, { user: userId }] } : query;
  }

  private toDto(qna: Qna): QnaItemDto {
    const user = qna.user as User | string;
    const assignee = qna.assignee as User | null | string | undefined;
    return QnaItemDto.fromPlain({
      id: qna.id,
      category: qna.category,
      title: qna.title,
      content: qna.content,
      priority: qna.priority,
      status: qna.status,
      answer: qna.answer ?? null,
      userId: typeof user === 'string' ? user : user.id,
      userName: typeof user === 'string' ? '' : user.name,
      userEmailMasked: typeof user === 'string' ? undefined : decrypt(user.emailEncrypted, env.PII_ENCRYPTION_KEY),
      assigneeName: typeof assignee === 'object' && assignee ? assignee.name : null,
      createdAt: qna.createdAt,
      updatedAt: qna.updatedAt,
    });
  }
}
