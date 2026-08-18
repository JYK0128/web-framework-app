import { Command } from '@nestjs/cqrs';

export class DeleteInquiryCommand extends Command<void> {
  constructor(
    public readonly inquiryId: string,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
