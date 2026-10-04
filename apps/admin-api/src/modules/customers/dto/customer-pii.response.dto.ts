import { ApiSchema } from '@nestjs/swagger';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'AdminCustomerPiiResponse' })
export class CustomerPiiResponseDto extends CustomerItemDto {}
