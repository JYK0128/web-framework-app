import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class DeleteAlertRequestDto extends DtoType(Alert) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
