import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

import { ToLowerCase } from '#/common/decorators/to-lower-case.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'LoginRequest' })
export class LoginCredentialRequestDto extends EntityDto(User, Account) {
  @ApiProperty({ type: 'string', format: 'email' })
  @ToLowerCase()
  @IsEmail()
  override email!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  override password!: string;

  @ApiPropertyOptional({ type: 'boolean', default: false, description: '로그인 상태 유지 (자동 로그인)' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
