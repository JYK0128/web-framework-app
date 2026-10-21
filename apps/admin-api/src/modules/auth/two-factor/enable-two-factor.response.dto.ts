import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class EnableTwoFactorResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}
