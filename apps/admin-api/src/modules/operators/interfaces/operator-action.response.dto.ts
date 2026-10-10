import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/dto/response';

@ApiSchema({ name: 'OperatorActionResponse' })
export class OperatorActionResponseDto extends OkResponseDto {}
