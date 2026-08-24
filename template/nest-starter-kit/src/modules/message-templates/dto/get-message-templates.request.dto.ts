import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

export class GetMessageTemplatesRequestDto extends DtoType(MessageTemplate) {
  @ApiEnumOptional({ enum: MessageChannel })
  @IsOptional()
  @IsEnum(MessageChannel)
  override channel?: MessageChannel;

  @ApiPropertyOptional({ type: 'string', example: 'ko' })
  @IsOptional()
  @IsString()
  override locale?: string;

  @ApiPropertyOptional({ type: 'string', description: '코드/이름/제목 검색' })
  @IsOptional()
  @IsString()
  search?: string;
}
