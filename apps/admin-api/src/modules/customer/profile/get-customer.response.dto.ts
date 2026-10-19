import { ApiPropertyOptional } from '@nestjs/swagger';

import { CustomerItemDto } from '#/modules/customer/profile/customer-item.dto';

export class GetCustomerResponseDto extends CustomerItemDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  memo?: string | null;
}
