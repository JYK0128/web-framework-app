import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'UnbanUserResponse' })
export class UnbanUserResponseDto extends OkResponseDto {}
