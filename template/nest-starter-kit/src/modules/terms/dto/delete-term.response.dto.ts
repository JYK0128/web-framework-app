import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteTermResponse' })
export class DeleteTermResponseDto extends OkResponseDto {}
