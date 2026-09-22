import { ApiSchema } from '@nestjs/swagger';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'CustomerDetailResponse' })
export class CustomerDetailResponseDto extends CustomerItemDto {}
