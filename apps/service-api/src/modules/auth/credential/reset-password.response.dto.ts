import { ApiSchema } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response';

@ApiSchema({ name: 'PasswordResetResponseDto' })
export class ResetPasswordResponseDto extends OkResponseDto {}
