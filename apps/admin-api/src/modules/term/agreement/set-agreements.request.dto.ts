import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { SetAgreementItemDto } from '~/modules/term/agreement/set-agreement-item.dto';

export class SetAgreementsRequestDto extends BaseDto {
  @ApiProperty({ type: [SetAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAgreementItemDto)
  agreements!: SetAgreementItemDto[];
}
