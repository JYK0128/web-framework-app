import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/dto/response';

@ApiSchema({ name: 'AdminCustomerActionResponse' })
export class CustomerActionResponseDto extends OkResponseDto {}
