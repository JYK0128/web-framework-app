import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { CustomerItemDto } from '~/modules/customer/profile/customer-item.dto';

export class GetCustomerPiiListResponseDto extends PageResponseDto<CustomerItemDto> {
  @ApiProperty({ type: [CustomerItemDto] })
  @Type(() => CustomerItemDto)
  items!: CustomerItemDto[];
}
