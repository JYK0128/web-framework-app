import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export class DeleteResourceResponseDto extends BaseDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  key!: string;

  @ApiProperty({ type: 'boolean', example: true })
  deleted: boolean = true;
}
