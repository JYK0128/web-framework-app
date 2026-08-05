import { ApiProperty } from '@nestjs/swagger';

import { TermGroupResponseDto } from './term-group.response.dto';

export class GetPublishedTermsResponseDto {
  @ApiProperty({ type: [TermGroupResponseDto] })
  terms!: TermGroupResponseDto[];
}
