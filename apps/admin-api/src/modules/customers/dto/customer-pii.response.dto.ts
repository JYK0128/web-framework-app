import { ApiSchema } from '@nestjs/swagger';

import { CustomerItemDto } from '#/modules/customers/dto/customer-item.dto';

@ApiSchema({ name: 'AdminCustomerPiiResponse' })
export class CustomerPiiResponseDto extends CustomerItemDto {}
