import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { SkipSanitize } from '#/common/decorators/skip-sanitize.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class UpdateMessageTemplateRequestDto extends DtoType(MessageTemplate) {
  @ApiPropertyOptional({ type: 'string', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  override code?: string;

  @ApiEnum({ enum: MessageChannel })
  @IsOptional()
  @IsEnum(MessageChannel)
  override channel?: MessageChannel;

  @ApiPropertyOptional({ type: 'string', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  override name?: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  override title?: string | null;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  @SkipSanitize()
  override body?: string;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  override isActive?: boolean;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string' } })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  override variables?: string[];

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  override description?: string | null;
}

export class UpdateMessageTemplateResponseDto extends MessageTemplateItemDto {}
