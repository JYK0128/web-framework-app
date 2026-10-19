import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'CustomerPageResponse' })
export class CustomerPageResponseDto extends PageResponseDto<CustomerItemDto> {
  @ApiProperty({ type: [CustomerItemDto] })
  @Type(() => CustomerItemDto) items!: CustomerItemDto[];
}
