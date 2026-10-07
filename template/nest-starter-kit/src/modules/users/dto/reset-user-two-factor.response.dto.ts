import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'ResetUserTwoFactorResponse' })
export class ResetUserTwoFactorResponseDto extends OkResponseDto {}
