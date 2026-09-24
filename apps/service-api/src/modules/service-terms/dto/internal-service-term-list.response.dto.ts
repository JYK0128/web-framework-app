import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { InternalServiceTermItemDto } from './internal-service-term-item.dto';

@ApiSchema({ name: 'InternalServiceTermListResponse' })
export class InternalServiceTermListResponseDto extends PageResponseDto<InternalServiceTermItemDto> {
  @ApiProperty({ type: [InternalServiceTermItemDto] }) items!: InternalServiceTermItemDto[];
}
