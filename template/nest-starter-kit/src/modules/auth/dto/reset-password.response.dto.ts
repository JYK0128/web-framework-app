import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'ResetPasswordResponse' })
export class ResetPasswordResponseDto extends OkResponseDto {}
