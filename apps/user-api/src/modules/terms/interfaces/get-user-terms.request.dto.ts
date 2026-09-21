import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { Term } from '#/entities/terms/term.entity';

export class GetUserTermsRequestDto extends PageRequestDto<Term> {
  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return this.groupId ? { $and: [query, { termGroup: this.groupId }] } : query;
  }
}
