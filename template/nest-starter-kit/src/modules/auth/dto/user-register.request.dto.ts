import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@pkg/shared/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { IsStrongPassword } from '#/common/decorators/is-strong-password.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'RegisterRequest' })
export class UserRegisterRequestDto extends DtoType(User, Account) {
  @ApiProperty({ type: 'string', format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  override email!: string;

  @ApiProperty({ type: 'string', minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsStrongPassword()
  override password!: string;

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  override name!: string;
}
