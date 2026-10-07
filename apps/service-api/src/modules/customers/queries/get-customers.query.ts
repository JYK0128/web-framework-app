import type { GetCustomersRequestDto } from '#/modules/customers/dto';

export class GetCustomersQuery {
  constructor(public readonly input: GetCustomersRequestDto) {}
}
