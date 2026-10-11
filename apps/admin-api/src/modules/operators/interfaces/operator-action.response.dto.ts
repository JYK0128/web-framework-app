import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'OperatorActionResponse' })
export class OperatorActionResponseDto extends OkResponseDto {}
