import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { SkipSanitize } from '#/common/decorators/skip-sanitize.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class CreateMessageTemplateRequestDto extends DtoType(MessageTemplate) {
  @ApiProperty({ type: 'string', maxLength: 100, example: 'CUSTOM_ALERT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  override code!: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 10, default: 'ko', example: 'ko' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  override locale?: string;

  @ApiEnum({ enum: MessageChannel, example: MessageChannel.EMAIL })
  @IsEnum(MessageChannel)
  @IsNotEmpty()
  override channel!: MessageChannel;

  @ApiProperty({ type: 'string', maxLength: 100, example: '맞춤 알림' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  override name!: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string | null;

  @ApiProperty({ type: 'string', description: '템플릿 본문 (Markdown/HTML/텍스트)' })
  @IsString()
  @IsNotEmpty()
  @SkipSanitize()
  override body!: string;

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
}

@ApiSchema({ name: 'CreateMessageTemplateResponse' })
export class CreateMessageTemplateResponseDto extends MessageTemplateItemDto {}
