import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response/list.response.dto';

import { ServiceTermAgreementItemDto } from './service-term-agreement-item.dto';

@ApiSchema({ name: 'GetServiceTermAgreementsResponse' })
export class GetServiceTermAgreementsResponseDto extends ListResponseDto<ServiceTermAgreementItemDto> {
  @ApiProperty({ type: [ServiceTermAgreementItemDto] }) items!: ServiceTermAgreementItemDto[];
}
