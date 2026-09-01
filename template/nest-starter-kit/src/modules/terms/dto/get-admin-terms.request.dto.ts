import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

export class GetAdminTermsRequestDto extends PageRequestDto<Term> {
  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  groupId?: string;

  override toFilterQuery(): ObjectQuery<Term> {
    const parentQuery = super.toFilterQuery();
    return this.groupId ? { $and: [parentQuery, { termGroup: this.groupId }] } : parentQuery;
  }
}
