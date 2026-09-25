import type { IEvent } from '@nestjs/cqrs';

export class SupportRoomCreatedEvent implements IEvent {
  constructor(public readonly roomId: string) {}
}
