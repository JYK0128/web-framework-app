import { Type } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { CustomerSessionItemDto } from './customer-session-item.dto';

@ApiSchema({ name: 'InternalCustomerSessionListResponse' })
export class CustomerSessionListResponseDto {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  @Type(() => CustomerSessionItemDto) items!: CustomerSessionItemDto[];
}
