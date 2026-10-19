import type { CreateCustomerMembershipRequestDto, UpdateCustomerMembershipRequestDto } from '#/modules/internal/dto/customer-membership.dto';

export class GetCustomerMembershipsQuery {}
export class GetCustomerMembershipPermissionsQuery {}
export class CreateCustomerMembershipCommand { constructor(public readonly input: CreateCustomerMembershipRequestDto) {} }
export class UpdateCustomerMembershipCommand { constructor(public readonly input: { membershipId: string, dto: UpdateCustomerMembershipRequestDto }) {} }
export class DeleteCustomerMembershipCommand { constructor(public readonly membershipId: string) {} }
