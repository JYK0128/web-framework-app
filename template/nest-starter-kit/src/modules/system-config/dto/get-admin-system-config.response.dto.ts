import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import type { SystemConfig } from '#/entities/system-config/system-config.entity';

import { InquiryConfigDto } from './inquiry-config.dto';
import { MaintenanceConfigDto } from './maintenance-config.dto';
import { OperationConfigDto } from './operation-config.dto';
import { SecurityConfigDto } from './security-config.dto';

export class GetAdminSystemConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto, description: '운영 설정 (시간, 공휴일, 안내메시지)' })
  @ValidateNested()
  @Type(() => OperationConfigDto)
  operation!: OperationConfigDto;

  @ApiProperty({ type: MaintenanceConfigDto, description: '시스템 점검 설정 (임시점검, 정기점검)' })
  @ValidateNested()
  @Type(() => MaintenanceConfigDto)
  maintenance!: MaintenanceConfigDto;

  @ApiProperty({ type: SecurityConfigDto, description: '계정 및 인증 보안 정책' })
  @ValidateNested()
  @Type(() => SecurityConfigDto)
  security!: SecurityConfigDto;

  @ApiProperty({ type: InquiryConfigDto, description: '1:1 문의 정책 및 알림 연동' })
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry!: InquiryConfigDto;

  constructor(configs: Array<Pick<SystemConfig, 'key' | 'value'>> = []) {
    const map = new Map(configs.map((config) => [config.key, config.value]));
    if (map.has('operation')) {
      this.operation = map.get('operation') as unknown as OperationConfigDto;
    }
    if (map.has('maintenance')) {
      this.maintenance = map.get('maintenance') as unknown as MaintenanceConfigDto;
    }
    if (map.has('security')) {
      this.security = map.get('security') as unknown as SecurityConfigDto;
    }
    if (map.has('inquiry')) {
      this.inquiry = map.get('inquiry') as unknown as InquiryConfigDto;
    }
  }
}
