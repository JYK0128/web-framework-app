import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendWebhookRequestDto extends BaseDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  text!: string;

  @ApiPropertyOptional({ description: '서비스 측 미응답 문의 ID에 대한 재발송 제한 키' })
  @IsOptional()
  @IsString()
  @Matches(/^support-unanswered:[a-zA-Z0-9_-]{1,128}$/)
  cooldownKey?: string;
}
