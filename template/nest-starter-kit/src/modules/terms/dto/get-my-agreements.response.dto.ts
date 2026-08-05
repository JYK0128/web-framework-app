import { ApiProperty } from '@nestjs/swagger';

import { MyAgreementResponseDto } from './my-agreement.response.dto';

export class GetMyAgreementsResponseDto {
  @ApiProperty({ type: [MyAgreementResponseDto] })
  terms!: MyAgreementResponseDto[];
}
