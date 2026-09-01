import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class UnbanUserRequestDto extends DtoType(User) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
