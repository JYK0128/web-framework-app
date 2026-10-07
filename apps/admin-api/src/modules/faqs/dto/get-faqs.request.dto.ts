import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import type { BaseEntity } from '#/entities/common/base.entity';

export class GetFaqsRequestDto extends PageRequestDto<BaseEntity> {
  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;
}
