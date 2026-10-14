import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { CustomerMembershipItemDto } from '#/modules/memberships/customer-membership-item.dto';

export class GetCustomerMembershipsResponseDto extends ListResponseDto<CustomerMembershipItemDto> {
  @ApiProperty({ type: [CustomerMembershipItemDto] })
  @Type(() => CustomerMembershipItemDto)
  items!: CustomerMembershipItemDto[];
}
