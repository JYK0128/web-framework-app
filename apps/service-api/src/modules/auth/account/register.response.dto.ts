import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class RegisterResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  emailVerificationRequired!: boolean;

  @ApiProperty({ type: Boolean })
  verificationEmailQueued!: boolean;
}
