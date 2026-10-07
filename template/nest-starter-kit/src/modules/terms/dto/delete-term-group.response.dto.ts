import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteTermGroupResponse' })
export class DeleteTermGroupResponseDto extends OkResponseDto {}
