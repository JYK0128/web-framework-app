import { ApiSchema } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response';

@ApiSchema({ name: 'EmailVerificationResponseDto' })
export class VerifyEmailResponseDto extends OkResponseDto {}
