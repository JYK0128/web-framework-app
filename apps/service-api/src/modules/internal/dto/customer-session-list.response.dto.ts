import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { CustomerSessionItemDto } from './customer-session-item.dto';

@ApiSchema({ name: 'InternalCustomerSessionListResponse' })
export class CustomerSessionListResponseDto {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  items!: CustomerSessionItemDto[];
}
