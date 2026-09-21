import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';

export class DeleteRoleResponseDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;
}
