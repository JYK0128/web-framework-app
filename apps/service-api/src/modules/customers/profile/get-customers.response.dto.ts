import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { CustomerItemDto } from '#/modules/customers/profile/customer-item.dto';

export class GetCustomersResponseDto extends PageResponseDto<CustomerItemDto> {
  @ApiProperty({ type: [CustomerItemDto] })
  @Type(() => CustomerItemDto)
  items!: CustomerItemDto[];
}
