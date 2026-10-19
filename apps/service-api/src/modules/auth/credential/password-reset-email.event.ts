import type { IEvent } from '@nestjs/cqrs';

export class PasswordResetEmailEvent implements IEvent {
  constructor(public readonly challengeId: string) {}
}
