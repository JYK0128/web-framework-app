export class DeleteAlertCommand {
  constructor(
    public readonly alertId: string,
    public readonly userId: string,
  ) {}
}
