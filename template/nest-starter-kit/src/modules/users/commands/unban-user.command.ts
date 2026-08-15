export class UnbanUserCommand {
  constructor(
    public readonly id: string,
    public readonly currentUserId: string,
  ) {}
}
