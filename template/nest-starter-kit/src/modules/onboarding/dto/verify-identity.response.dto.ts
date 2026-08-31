import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender } from '#/common/constants/identity.constants';
import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';

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
