import { ApiProperty } from '@nestjs/swagger';

import { TermDto } from './term.dto';

export class GetTermsResponseDto {
  @ApiProperty({ type: [TermDto] })
  terms!: TermDto[];
}
