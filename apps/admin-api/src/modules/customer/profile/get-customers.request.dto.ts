import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsIn } from 'class-validator';

import type { BaseEntity } from '~/core/database/entities/base.entity';

const GetCustomersRequestDtoBase = QueryRequestDtoFor<BaseEntity>()({
  search: { fields: [] },
  sort: { fields: ['createdAt', 'updatedAt'], default: ['createdAt'] },
  page: {},
});

export class GetCustomersRequestDto extends GetCustomersRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];
}
