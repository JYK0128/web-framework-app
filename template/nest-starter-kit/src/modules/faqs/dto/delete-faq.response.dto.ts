import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteFaqResponse' })
export class DeleteFaqResponseDto extends OkResponseDto {}
