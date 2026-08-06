import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { TermAgreementItemDto } from '#/modules/terms/dto/update-agreements.request.dto';

@ApiSchema({ name: 'RegisterRequest' })
export class UserRegisterRequestDto extends IntersectionType(
  DtoType(User, ['email', 'name'] as const),
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

  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Example User' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  override name!: string;

  @ApiProperty({ type: [TermAgreementItemDto], required: false, description: 'Optional initial term agreements' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermAgreementItemDto)
  agreements?: TermAgreementItemDto[];
}
