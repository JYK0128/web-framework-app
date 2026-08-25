import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { SkipSanitize } from '#/common/decorators/skip-sanitize.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageTemplate } from '#/entities/templates/message-template.entity';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class UpdateMessageTemplateRequestDto extends DtoType(MessageTemplate) {
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
}

export class UpdateMessageTemplateResponseDto extends MessageTemplateItemDto {}
