import { Command } from '@nestjs/cqrs';

export class CheckUnansweredSupportRoomsCommand extends Command<void> {
  constructor(public readonly input: Record<string, never>) { super(); }
}
