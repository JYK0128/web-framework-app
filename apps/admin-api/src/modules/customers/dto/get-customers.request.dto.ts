import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common/base.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetCustomersRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];
}
