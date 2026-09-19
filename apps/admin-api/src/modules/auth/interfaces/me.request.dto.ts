import { ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'MeRequest' })
export class MeRequestDto extends BaseDto {}
