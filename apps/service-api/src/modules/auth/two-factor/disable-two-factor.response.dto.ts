import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'TwoFactorStateResponseDto' })
export class DisableTwoFactorResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}
