import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common/base.entity';
import { PageRequestDto } from '#/core/http/dto/request';

export class GetFaqsRequestDto extends PageRequestDto<BaseEntity, 'sortOrder' | 'createdAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['sortOrder', 'createdAt'] })
  @IsIn(['sortOrder', 'createdAt'], { each: true })
  override sort: ('sortOrder' | 'createdAt')[] = ['sortOrder', 'createdAt'];

  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;
}
