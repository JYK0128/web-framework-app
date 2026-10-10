export class SupportUnansweredAlertEvent {
  constructor(
    readonly roomId: string,
    readonly elapsedMinutes: number,
    readonly createdAt: string,
  ) {}
}
