import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/dto/response/ok.response.dto';

@ApiSchema({ name: 'InternalCustomerActionResponse' })
export class CustomerActionResponseDto extends OkResponseDto {}
