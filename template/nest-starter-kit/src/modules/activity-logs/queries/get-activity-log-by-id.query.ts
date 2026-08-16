import { type IQuery } from '@nestjs/cqrs';

export class GetActivityLogByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
