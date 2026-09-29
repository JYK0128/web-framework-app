import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'AdminCustomerListResponse' })
export class CustomerListResponseDto extends PageResponseDto<CustomerItemDto> {
  @ApiProperty({ type: [CustomerItemDto] })
  items!: CustomerItemDto[];
}
