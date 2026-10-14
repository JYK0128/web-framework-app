import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/base.entity';

export class GetFaqsRequestDto extends PageRequestDto<BaseEntity, 'sortOrder' | 'createdAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['sortOrder', 'createdAt'] })
  @IsIn(['sortOrder', 'createdAt'], { each: true })
  override sort: ('sortOrder' | 'createdAt')[] = ['sortOrder', 'createdAt'];

  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;
}
