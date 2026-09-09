import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class MarkAlertReadRequestDto extends EntityDto(Alert) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
