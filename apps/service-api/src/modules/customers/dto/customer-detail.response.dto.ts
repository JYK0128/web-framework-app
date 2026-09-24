import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'CustomerDetailResponse' })
export class CustomerDetailResponseDto extends CustomerItemDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  memo?: string | null;
}
