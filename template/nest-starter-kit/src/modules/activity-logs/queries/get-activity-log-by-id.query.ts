import { type IQuery } from '@nestjs/cqrs';

export interface GetActivityLogByIdPayload {
  id: string
}

export class GetActivityLogByIdQuery implements IQuery {
  constructor(public readonly input: GetActivityLogByIdPayload) {}
}
