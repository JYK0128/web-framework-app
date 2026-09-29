import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

export class TestEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ type: EmailConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  config?: EmailConfigDto;
}

export class TestEmailResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '테스트 이메일이 성공적으로 발송되었습니다.' })
  message!: string;
}
