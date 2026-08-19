import type { AlertType } from '#/entities/alerts/alert.entity';

export class CreateAlertCommand {
  constructor(
    public readonly userId: string,
    public readonly type: AlertType,
    public readonly title: string,
    public readonly content: string,
    public readonly linkUrl?: string | null,
  ) {}
}
