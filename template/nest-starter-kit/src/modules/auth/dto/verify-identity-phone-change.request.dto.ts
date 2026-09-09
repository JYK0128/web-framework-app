import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class VerifyIdentityPhoneChangeRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', description: 'PortOne Identity Verification ID' })
  @IsString()
  @MinLength(1)
  identityVerificationId!: string;
}
