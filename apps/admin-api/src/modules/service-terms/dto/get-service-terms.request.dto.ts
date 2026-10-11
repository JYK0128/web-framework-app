import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { Term } from '#/core/database/entities/terms/term.entity';
import { PageRequestDto } from '#/core/http/dto/request';

export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }
}
