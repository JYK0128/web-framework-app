import { Type } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response';

import { CustomerSessionItemDto } from './customer-session-item.dto';

@ApiSchema({ name: 'AdminCustomerSessionListResponse' })
export class CustomerSessionListResponseDto extends ListResponseDto<CustomerSessionItemDto> {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  @Type(() => CustomerSessionItemDto) override items!: CustomerSessionItemDto[];
}
