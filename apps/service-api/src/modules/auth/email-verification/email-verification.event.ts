import type { IEvent } from '@nestjs/cqrs';

export class EmailVerificationEvent implements IEvent {
  constructor(public readonly challengeId: string, public readonly ttlMinutes: number) {}
}
