import { ApiSchema } from '@nestjs/swagger';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'AdminCustomerDetailResponse' })
export class CustomerDetailResponseDto extends CustomerItemDto {}
