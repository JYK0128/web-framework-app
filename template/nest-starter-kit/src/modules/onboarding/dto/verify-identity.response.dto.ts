import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { Gender } from '#/entities/auth/user-identity.entity';

export class VerifyIdentityResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string', example: '홍길동' })
  name!: string;

  @ApiProperty({ type: 'string', example: '01012345678' })
  phoneNumber!: string;

  @ApiProperty({ type: 'boolean', example: true })
  phoneNumberVerified!: boolean;

  @ApiPropertyOptional({ type: 'string', example: '1990-01-01' })
  birthDate?: string;

  @ApiEnumOptional({ enum: Gender })
  gender?: Gender;
}
