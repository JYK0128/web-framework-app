import type { IEvent } from '@nestjs/cqrs';

export class EmailChallengeIssuedEvent implements IEvent {
  constructor(
    public readonly email: string,
    public readonly challengeId: string,
    public readonly code: string,
    public readonly expiresIn: number,
  ) {}
}
