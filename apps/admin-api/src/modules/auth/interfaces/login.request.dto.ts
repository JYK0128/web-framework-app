import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'LoginRequest' })
export class LoginRequestDto extends EntityDto(User, Account) {
  @ApiProperty({ type: String, format: 'email', example: 'admin@test.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  @IsNotEmpty()
  override email!: string;

  @ApiProperty({ type: String, example: '1q2w3e4r1@' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ type: Boolean, default: false, description: '로그인 상태 유지 (자동 로그인)' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
