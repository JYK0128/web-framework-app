import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional } from 'class-validator';

export class RenderPreviewRequestDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true, description: '치환 테스트용 샘플 변수 객체' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}

export class RenderPreviewResponseDto {
  @ApiPropertyOptional({ type: 'string', nullable: true })
  title: string | null = null;

  @ApiProperty({ type: 'string' })
  body!: string;

  @ApiProperty({ type: 'string' })
  channel!: string;

  @ApiProperty({ type: 'string' })
  locale!: string;
}

export class TestSendTemplateRequestDto {
  @ApiPropertyOptional({ type: 'string', description: '테스트 수신 이메일 주소' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, description: '치환용 샘플 변수' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}

export class TestSendTemplateResponseDto {
  @ApiProperty({ type: 'boolean' })
  success!: boolean;

  @ApiProperty({ type: 'string' })
  message!: string;
}
