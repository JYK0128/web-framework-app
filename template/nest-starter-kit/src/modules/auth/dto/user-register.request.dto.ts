import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { IsStrongPassword } from '#/common/decorators/is-strong-password.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'RegisterRequest' })
export class UserRegisterRequestDto extends IntersectionType(
  DtoType(User, ['email', 'name'] as const),
  DtoType(Account, ['password'] as const),
) {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  override email!: string;

  @ApiProperty({ minLength: env.PASSWORD_MIN_LENGTH, maxLength: 128, example: 'test1234!' })
  @IsStrongPassword()
  override password!: string;

  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Example User' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  override name!: string;
}
