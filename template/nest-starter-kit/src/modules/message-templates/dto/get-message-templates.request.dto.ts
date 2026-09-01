import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { PageRequestDto } from '#/common/interfaces';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

export class GetMessageTemplatesRequestDto extends PageRequestDto<MessageTemplate> {
  @ApiEnumOptional({ enum: MessageChannel })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiPropertyOptional({ type: 'string', description: '코드/이름/제목 검색' })
  @IsOptional()
  @IsString()
  override search?: string;

  override get searchFields(): (keyof MessageTemplate)[] {
    return ['code', 'name', 'title'];
  }

  override toFilterQuery(): ObjectQuery<MessageTemplate> {
    const filters: ObjectQuery<MessageTemplate>[] = [];
    if (this.channel) filters.push({ channel: this.channel });
    const search = this.toSearchQuery();
    if (search) filters.push(search);
    return filters.length > 0 ? { $and: filters } : {};
  }
}
