import { Command } from '@nestjs/cqrs';

export class AutoCloseSupportRoomsCommand extends Command<void> {
  constructor(public readonly input: Record<string, never>) { super(); }
}
