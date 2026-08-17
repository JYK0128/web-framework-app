import type { IEvent } from '@nestjs/cqrs';

export class EmailVerificationCodeIssuedEvent implements IEvent {
  constructor(
    public readonly email: string,
    public readonly code: string,
    public readonly expiresIn: number,
  ) {}
}
