import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class VerifyEmailRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsString()
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(512)
  code!: string;
}
