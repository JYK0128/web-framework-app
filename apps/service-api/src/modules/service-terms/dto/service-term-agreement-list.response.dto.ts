import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/dto/response/list.response.dto';

import { ServiceTermAgreementItemDto } from './service-term-agreement-item.dto';

@ApiSchema({ name: 'ServiceTermAgreementListResponse' })
export class ServiceTermAgreementListResponseDto extends ListResponseDto<ServiceTermAgreementItemDto> {
  @ApiProperty({ type: [ServiceTermAgreementItemDto] }) @Type(() => ServiceTermAgreementItemDto) items!: ServiceTermAgreementItemDto[];
}
