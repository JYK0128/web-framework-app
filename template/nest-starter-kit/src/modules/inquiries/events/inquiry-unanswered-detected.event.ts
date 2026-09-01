import { IEvent } from '@nestjs/cqrs';

export class InquiryUnansweredDetectedEvent implements IEvent {
  constructor(
    public readonly inquiry: {
      id: string
      title: string
      category: string
      assigneeName?: string | null
    },
    public readonly lastMessage: {
      content: string
      createdAt: Date
    },
    public readonly elapsedMinutes: number,
  ) {}
}
