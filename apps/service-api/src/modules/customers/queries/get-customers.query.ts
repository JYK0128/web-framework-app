import type { GetCustomersRequestDto } from '../dto';

export class GetCustomersQuery {
  constructor(public readonly input: GetCustomersRequestDto) {}
}
