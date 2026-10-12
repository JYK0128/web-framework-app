import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'PasswordResetResponseDto' })
export class ResetPasswordResponseDto extends OkResponseDto {}
