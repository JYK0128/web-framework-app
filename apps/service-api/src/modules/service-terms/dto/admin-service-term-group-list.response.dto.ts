import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '#/common/interfaces/response/list.response.dto';
import { AdminServiceTermGroupItemDto } from './admin-service-term-group-item.dto';

export class AdminServiceTermGroupListResponseDto extends ListResponseDto<AdminServiceTermGroupItemDto> {
  @ApiProperty({ type: [AdminServiceTermGroupItemDto] })
  override items!: AdminServiceTermGroupItemDto[];
}
