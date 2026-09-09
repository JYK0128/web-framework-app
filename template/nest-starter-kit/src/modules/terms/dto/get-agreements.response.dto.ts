import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { AgreementDto } from './agreement.dto';

export class GetAgreementsResponseDto extends ListResponseDto<AgreementDto> {
  @ApiProperty({ type: [AgreementDto] })
  override items!: AgreementDto[];
}
