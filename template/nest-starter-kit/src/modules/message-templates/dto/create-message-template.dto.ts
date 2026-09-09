import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class CreateMessageTemplateChannelDto {
  @ApiEnum({ enum: MessageChannel, example: MessageChannel.EMAIL })
  @IsEnum(MessageChannel)
  @IsNotEmpty()
  channel!: MessageChannel;

  @ApiPropertyOptional({ type: 'string', maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiProperty({ type: 'string', description: '템플릿 본문 (Markdown/HTML/텍스트)' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ type: 'integer', default: 1 })
  @IsOptional()
  @IsInt()
  priority?: number = 1;

  @ApiPropertyOptional({ type: 'boolean', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, unknown> | null;
}

export class CreateMessageTemplateRequestDto extends EntityDto(MessageTemplate) {
  @ApiProperty({ type: 'string', maxLength: 100, example: 'CUSTOM_ALERT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  override code!: string;

  @ApiProperty({ type: 'string', maxLength: 100, example: '맞춤 알림' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  override name!: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string' }, default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  override variables?: string[];

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  override description?: string | null;

  @ApiPropertyOptional({ type: 'boolean', default: true })
  @IsOptional()
  @IsBoolean()
  override isActive?: boolean;

  @ApiProperty({ type: () => [CreateMessageTemplateChannelDto], description: '템플릿에 연결된 발송 채널 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMessageTemplateChannelDto)
  channels!: CreateMessageTemplateChannelDto[];
}

@ApiSchema({ name: 'CreateMessageTemplateResponse' })
export class CreateMessageTemplateResponseDto extends MessageTemplateItemDto {}
