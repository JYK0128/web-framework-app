export class GetMyAlertsQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 50,
  ) {}
}
