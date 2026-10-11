import { QnaPriority } from '#/core/database/entities/qna/qna.entity';

export class QnaCreatedEvent {
  constructor(
    public readonly qnaId: string,
    public readonly priority: QnaPriority,
  ) {}
}
