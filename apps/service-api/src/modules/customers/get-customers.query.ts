import type { GetCustomersRequestDto } from '#/modules/customers';

export class GetCustomersQuery {
  constructor(public readonly input: GetCustomersRequestDto) {}
}
