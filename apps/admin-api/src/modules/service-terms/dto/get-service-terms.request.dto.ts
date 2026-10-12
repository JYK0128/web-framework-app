import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { Term } from '#/core/database/entities/terms';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }
}
