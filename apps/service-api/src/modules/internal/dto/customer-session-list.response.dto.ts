import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/dto/response';

import { CustomerSessionItemDto } from './customer-session-item.dto';

@ApiSchema({ name: 'InternalCustomerSessionListResponse' })
export class CustomerSessionListResponseDto extends ListResponseDto<CustomerSessionItemDto> {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  @Type(() => CustomerSessionItemDto) override items!: CustomerSessionItemDto[];
}
