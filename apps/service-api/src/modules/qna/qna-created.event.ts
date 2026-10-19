import { QnaPriority } from '@pkg/shared/constants';

export class QnaCreatedEvent {
  constructor(
    public readonly qnaId: string,
    public readonly priority: QnaPriority,
  ) {}
}
