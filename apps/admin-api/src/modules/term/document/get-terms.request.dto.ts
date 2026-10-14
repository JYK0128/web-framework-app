import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import { IsOptional, IsString } from 'class-validator';

import { Term } from '#/core/database/entities/terms';

export class GetTermsRequestDto extends PageRequestDto<Term> {
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
