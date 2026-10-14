import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { CustomerMembershipPermissionItemDto } from '#/modules/memberships/customer-membership-permission-item.dto';

export class GetCustomerMembershipPermissionsResponseDto extends ListResponseDto<CustomerMembershipPermissionItemDto> {
  @ApiProperty({ type: [CustomerMembershipPermissionItemDto] })
  @Type(() => CustomerMembershipPermissionItemDto)
  items!: CustomerMembershipPermissionItemDto[];
}
