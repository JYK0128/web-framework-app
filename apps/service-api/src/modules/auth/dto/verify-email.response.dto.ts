import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'EmailVerificationResponseDto' })
export class VerifyEmailResponseDto extends OkResponseDto {}
