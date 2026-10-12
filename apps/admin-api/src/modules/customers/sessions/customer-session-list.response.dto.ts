import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { CustomerSessionItemDto } from '#/modules/customers/sessions/customer-session-item.dto';

@ApiSchema({ name: 'AdminCustomerSessionListResponse' })
export class CustomerSessionListResponseDto extends ListResponseDto<CustomerSessionItemDto> {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  @Type(() => CustomerSessionItemDto) override items!: CustomerSessionItemDto[];
}
