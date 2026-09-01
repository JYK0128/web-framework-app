import { ApiProperty } from '@nestjs/swagger';

import { AgreementDto } from './agreement.dto';

export class GetAgreementsResponseDto {
  @ApiProperty({ type: [AgreementDto] })
  terms!: AgreementDto[];
}
