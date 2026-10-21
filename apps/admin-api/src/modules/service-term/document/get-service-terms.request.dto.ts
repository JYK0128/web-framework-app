import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request';
import { IsOptional, IsUUID } from 'class-validator';

import { Term } from '~/core/database/entities/terms';

export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }
}
