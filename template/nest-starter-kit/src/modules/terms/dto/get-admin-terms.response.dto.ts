import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { AdminTermDto } from './admin-term.dto';

export class GetAdminTermsResponseDto extends PageResponseDto<AdminTermDto> {
  @ApiProperty({ type: () => [AdminTermDto] })
  override items!: AdminTermDto[];
}
