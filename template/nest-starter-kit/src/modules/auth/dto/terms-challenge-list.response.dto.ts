import { ApiProperty } from '@nestjs/swagger';

import { TermGroupResponseDto } from '#/modules/terms/dto/term-group.response.dto';

export class TermsChallengeListResponseDto {
  @ApiProperty({ type: [TermGroupResponseDto] })
  terms!: TermGroupResponseDto[];
}
