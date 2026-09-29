import { ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'OperatorActionResponse' })
export class OperatorActionResponseDto extends BaseDto {}
