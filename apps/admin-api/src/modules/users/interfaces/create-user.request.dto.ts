import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ example: '관리자 홍길동', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'admin@example.com', format: 'email', maxLength: 320 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, description: '초기 비밀번호' })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password!: string;

  @ApiPropertyOptional({ type: String, default: 'admin', example: 'admin' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role = 'admin';
}
