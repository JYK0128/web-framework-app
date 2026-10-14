import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { CustomerSessionItemDto } from '#/modules/customers/sessions/customer-session-item.dto';

export class GetCustomerSessionsResponseDto extends ListResponseDto<CustomerSessionItemDto> {
  @ApiProperty({ type: [CustomerSessionItemDto] })
  @Type(() => CustomerSessionItemDto)
  override items!: CustomerSessionItemDto[];
}
