import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'RestoreUserResponse' })
export class RestoreUserResponseDto extends OkResponseDto {}
