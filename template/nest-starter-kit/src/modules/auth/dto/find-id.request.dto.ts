import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'FindIdRequest' })
export class FindIdRequestDto extends DtoType(User) {
  @ApiProperty({ type: 'string', description: '가입자 성명', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  override name!: string;

  @ApiPropertyOptional({ type: 'string', description: '가입자 휴대폰 번호', maxLength: 30 })
  @IsOptional()
  @IsString()
  override phoneNumber?: string;
}
