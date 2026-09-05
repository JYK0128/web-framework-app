import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { SecurityConfigDto } from './security-config.dto';

export class UpdateSecurityTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: SecurityConfigDto, description: '보안 정책 설정' })
  @ValidateNested()
  @Type(() => SecurityConfigDto)
  security!: SecurityConfigDto;
}
