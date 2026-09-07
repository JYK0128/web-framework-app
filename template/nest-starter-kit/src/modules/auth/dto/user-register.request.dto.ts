import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { IsEqualTo } from '#/common/decorators/is-equal-to.decorator';
import { ToLowerCase } from '#/common/decorators/to-lower-case.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'RegisterRequest' })
export class UserRegisterRequestDto extends DtoType(User, Account) {
  @ApiProperty({ type: 'string', format: 'email' })
  @ToLowerCase()
  @IsEmail()
  override email!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override password!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsEqualTo('password', { message: 'login.passwordMismatch' })
  confirmPassword!: string;

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  override name!: string;

  @ApiProperty({ type: 'string', required: false, maxLength: 30 })
  override phoneNumber?: string;
}
