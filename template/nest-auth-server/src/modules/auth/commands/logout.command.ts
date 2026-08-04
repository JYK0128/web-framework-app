import { Command } from '@nestjs/cqrs';

export class LogoutCommand extends Command<void> {
  constructor(public readonly token: string | null) {
    super();
  }
}
