import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { SetAgreementItemDto } from '#/modules/terms/agreements/set-agreement-item.dto';

export class SetAgreementsRequestDto extends BaseDto {
  @ApiProperty({ type: [SetAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAgreementItemDto)
  agreements!: SetAgreementItemDto[];
}
