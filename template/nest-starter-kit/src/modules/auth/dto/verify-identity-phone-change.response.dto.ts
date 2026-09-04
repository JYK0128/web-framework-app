import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { Gender } from '#/entities/auth/user-identity.entity';

export class VerifyIdentityPhoneChangeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ type: 'string' })
  phoneNumber!: string;

  @ApiProperty({ type: 'boolean' })
  phoneNumberVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  birthDate?: string | null;

  @ApiEnum({ enum: Gender, nullable: true, required: false })
  gender?: Gender | null;
}
