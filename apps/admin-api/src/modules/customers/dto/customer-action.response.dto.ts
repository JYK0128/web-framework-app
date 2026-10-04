import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'AdminCustomerActionResponse' })
export class CustomerActionResponseDto extends OkResponseDto {}
