import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class ResetUserPasswordRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
