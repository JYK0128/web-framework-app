import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { Term } from '#/core/database/entities/terms';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetInternalServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() groupId?: string;
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return this.groupId ? { $and: [query, { termGroup: this.groupId }] } : query;
  }
}
