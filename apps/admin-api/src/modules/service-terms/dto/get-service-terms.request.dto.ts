import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { Term } from '#/entities/terms/term.entity';

export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }
}
