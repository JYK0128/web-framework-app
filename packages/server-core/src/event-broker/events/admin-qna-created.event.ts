export class AdminQnaCreatedEvent {
  constructor(
    readonly qnaId: string,
    readonly title: string,
    readonly priority: 'low' | 'normal' | 'high' | 'urgent',
    readonly createdAt: string,
  ) {}
}
