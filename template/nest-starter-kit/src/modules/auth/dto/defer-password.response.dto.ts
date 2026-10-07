import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeferPasswordResponse' })
export class DeferPasswordResponseDto extends OkResponseDto {}
