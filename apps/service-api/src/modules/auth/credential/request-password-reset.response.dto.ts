import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

@ApiSchema({ name: 'PasswordResetRequestResponseDto' })
export class RequestPasswordResetResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  accepted!: boolean;
}
