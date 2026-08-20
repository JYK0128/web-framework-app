import { Command } from '@nestjs/cqrs';

export interface DeleteFaqPayload {
  id: string
}

export class DeleteFaqCommand extends Command<void> {
  constructor(public readonly input: DeleteFaqPayload) {
    super();
  }
}
