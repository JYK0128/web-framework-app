export class DeleteNoticeCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}
