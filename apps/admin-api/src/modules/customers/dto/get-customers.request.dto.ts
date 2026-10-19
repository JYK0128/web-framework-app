import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import type { BaseEntity } from '#/entities/common/base.entity';

export class GetCustomersRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];
}
