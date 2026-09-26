import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SmtpEmailDetailsDto {
  @ApiPropertyOptional({ description: 'SMTP 호스트 서버 주소', example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ description: 'SMTP 포트 번호', example: 587 })
  @IsOptional()
  @IsNumber()
  port?: number;

  @ApiPropertyOptional({ description: 'SSL/TLS 보안 연결 사용 여부', example: false })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiPropertyOptional({ description: 'SMTP 인증 계정(이메일 또는 아이디)', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ description: 'SMTP 인증 비밀번호(수정 시에만 전달)', example: 'password123' })
  @IsOptional()
  @IsString()
  pass?: string;
}
