import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { ServiceTermItemDto } from './service-term-item.dto';

@ApiSchema({ name: 'ServiceTermPageResponse' })
export class ServiceTermPageResponseDto extends PageResponseDto<ServiceTermItemDto> {
  @ApiProperty({ type: [ServiceTermItemDto] }) @Type(() => ServiceTermItemDto) items!: ServiceTermItemDto[];
}
