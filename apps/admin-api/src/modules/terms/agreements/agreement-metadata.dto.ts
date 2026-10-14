import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsObject, IsOptional } from 'class-validator';

import { AgreementOptionValue } from '#/modules/terms/agreements/term-agreement-item.constants';

export class AgreementMetadataDto extends BaseDto {
  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    additionalProperties: {
      oneOf: [
        { type: 'boolean' },
        { type: 'string' },
        { type: 'number' },
      ],
      nullable: true,
    },
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, AgreementOptionValue> | null;
}
