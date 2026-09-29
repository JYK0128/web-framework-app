import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response';

import { ServiceTermGroupItemDto } from './service-term-group-item.dto';

export class ServiceTermGroupListResponseDto extends ListResponseDto<ServiceTermGroupItemDto> { @ApiProperty({ type: [ServiceTermGroupItemDto] }) override items!: ServiceTermGroupItemDto[]; }
