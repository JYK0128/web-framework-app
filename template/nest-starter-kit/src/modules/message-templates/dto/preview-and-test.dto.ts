import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageChannel } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

export class RenderPreviewRequestDto extends DtoType(MessageTemplateChannel) {
  @ApiEnumOptional({ enum: MessageChannel, description: '미리보기 대상 채널 (미지정 시 1순위 활성 채널)' })
  @IsOptional()
  @IsEnum(MessageChannel)
  override channel?: MessageChannel;

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
}

export class TestSendTemplateRequestDto extends DtoType(MessageTemplateChannel) {
  @ApiEnumOptional({ enum: MessageChannel, description: '테스트 발송 대상 채널 (미지정 시 EMAIL)' })
  @IsOptional()
  @IsEnum(MessageChannel)
  override channel?: MessageChannel;

  @ApiPropertyOptional({ type: 'string', description: '테스트 수신 이메일 주소 (EMAIL 채널 시 필수)' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ type: 'string', description: '테스트 수신 휴대폰 번호 (SMS/ALIMTALK 채널 시 필수)' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

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
