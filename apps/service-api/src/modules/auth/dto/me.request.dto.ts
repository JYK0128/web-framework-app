import { ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'MeRequest' })
export class MeRequestDto extends BaseDto {}
