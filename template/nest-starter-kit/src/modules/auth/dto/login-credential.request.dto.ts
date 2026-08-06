import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'LoginRequest' })
export class LoginCredentialRequestDto extends IntersectionType(
  DtoType(User, ['email'] as const),
  DtoType(Account, ['password'] as const),
) {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  override email!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, example: 'correct-horse-battery-staple' })
  @IsString()
  @Length(12, 128)
  override password!: string;
}
