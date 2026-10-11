import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { AgreementOptionValue } from '#/modules/terms/dto/term-agreement-item.constants';

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
