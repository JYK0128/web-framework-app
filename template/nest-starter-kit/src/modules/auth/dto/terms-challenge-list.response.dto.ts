import { ApiProperty } from '@nestjs/swagger';

import { TermDto } from '#/modules/terms/dto/term.dto';

export class TermsChallengeListResponseDto {
  @ApiProperty({ type: [TermDto] })
  terms!: TermDto[];
}
