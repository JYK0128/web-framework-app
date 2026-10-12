import { QnaPriority } from '#/core/database/entities/qna';

export class QnaCreatedEvent {
  constructor(
    public readonly qnaId: string,
    public readonly priority: QnaPriority,
  ) {}
}
