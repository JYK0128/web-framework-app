import { Command } from '@nestjs/cqrs';

export class DeleteFaqCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
