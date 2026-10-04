import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'OperatorActionResponse' })
export class OperatorActionResponseDto extends OkResponseDto {}
