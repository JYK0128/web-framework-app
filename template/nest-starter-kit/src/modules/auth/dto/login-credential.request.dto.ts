import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '#/common/configs/auth.config';
import { ToLowerCase } from '#/common/decorators/to-lower-case.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'LoginRequest' })
export class LoginCredentialRequestDto extends DtoType(User, Account) {
  @ApiProperty({ type: 'string', format: 'email' })
  @ToLowerCase()
  @IsEmail()
  override email!: string;

  @ApiProperty({ type: 'string', minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  override password!: string;

  @ApiPropertyOptional({ type: 'boolean', default: false, description: '로그인 상태 유지 (자동 로그인)' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
