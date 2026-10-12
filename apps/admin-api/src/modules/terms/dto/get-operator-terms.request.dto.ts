import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { Term } from '#/core/database/entities/terms';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetOperatorTermsRequestDto extends PageRequestDto<Term> {
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
