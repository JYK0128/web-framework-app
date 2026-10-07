import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'ChangePasswordResponse' })
export class ChangePasswordResponseDto extends OkResponseDto {}
