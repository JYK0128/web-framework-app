import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'LoginRequest' })
export class LoginCredentialRequestDto extends IntersectionType(
  DtoType(User, ['email'] as const),
  DtoType(Account, ['password'] as const),
) {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  override email!: string;

  @ApiProperty({ minLength: env.PASSWORD_MIN_LENGTH, example: 'pass123!' })
  @IsString()
  override password!: string;
}
