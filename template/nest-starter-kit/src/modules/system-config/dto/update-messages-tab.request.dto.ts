import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { OperatingMessagesDto } from './operating-hours.dto';

export class UpdateMessagesTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: OperatingMessagesDto })
  @ValidateNested()
  @Type(() => OperatingMessagesDto)
  messages!: OperatingMessagesDto;
}
