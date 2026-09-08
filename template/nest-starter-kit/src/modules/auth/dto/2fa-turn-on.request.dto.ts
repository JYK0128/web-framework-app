import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class TwoFactorTurnOnRequestDto extends DtoType(User) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
