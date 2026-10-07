import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import type { BaseEntity } from '#/entities/common/base.entity';

export class GetFaqsRequestDto extends PageRequestDto<BaseEntity, 'sortOrder' | 'createdAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['sortOrder', 'createdAt'] })
  @IsIn(['sortOrder', 'createdAt'], { each: true })
  override sort: ('sortOrder' | 'createdAt')[] = ['sortOrder', 'createdAt'];

  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;
}
