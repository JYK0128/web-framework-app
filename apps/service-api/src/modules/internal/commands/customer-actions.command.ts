import type { BanCustomerRequestDto, UpdateCustomerMemoRequestDto, UpdateCustomerRoleRequestDto } from '#/modules/internal/dto';

export class BanCustomerCommand {
  constructor(public readonly input: { customerId: string, dto: BanCustomerRequestDto }) {}
}

export class UnbanCustomerCommand {
  constructor(public readonly customerId: string) {}
}

export class DeleteCustomerCommand {
  constructor(public readonly customerId: string) {}
}

export class UpdateCustomerRoleCommand {
  constructor(public readonly input: { customerId: string, dto: UpdateCustomerRoleRequestDto }) {}
}

export class UpdateCustomerMemoCommand {
  constructor(public readonly input: { customerId: string, dto: UpdateCustomerMemoRequestDto }) {}
}
