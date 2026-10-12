import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Account, User } from '#/core/database/entities/auth';
import { ToLowerCase } from '#/core/http/decorators/to-lower-case.decorator';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

@ApiSchema({ name: 'LoginRequest' })
export class LoginRequestDto extends EntityDto(User, Account) {
  @ApiProperty({ type: String, format: 'email', example: 'operator@test.com' })
  @ToLowerCase()
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ type: String, example: '1q2w3e4r1@' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ type: Boolean, default: false, description: '로그인 상태 유지 (자동 로그인)' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
