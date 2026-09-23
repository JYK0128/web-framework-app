import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '#/common/interfaces/response';
import { AdminServiceTermGroupItemDto } from './admin-service-term-group-item.dto';
export class AdminServiceTermGroupListResponseDto extends ListResponseDto<AdminServiceTermGroupItemDto> { @ApiProperty({ type: [AdminServiceTermGroupItemDto] }) override items!: AdminServiceTermGroupItemDto[]; }
