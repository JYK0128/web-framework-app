import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class EnableTwoFactorResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}
