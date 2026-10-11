import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class DeleteRoleResponseDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;
}
