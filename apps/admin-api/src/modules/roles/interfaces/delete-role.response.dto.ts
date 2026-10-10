import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base';

export class DeleteRoleResponseDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;
}
