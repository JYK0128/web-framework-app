export type UserNotification = {
  id: string
  kind: 'support.reply'
  roomId: string
  message: string
  createdAt: string
} | {
  id: string
  kind: 'qna.answer'
  qnaId: string
  questionTitle: string
  message: string
  createdAt: string
};

export class UserNotificationCreatedEvent {
  constructor(
    readonly userId: string,
    readonly notification: UserNotification,
  ) {}
}
