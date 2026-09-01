import { ApiProperty } from '@nestjs/swagger';

import type { SystemConfig } from '#/entities/system-config/system-config.entity';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';
import { OperatingHoursDto, OperatingMaintenanceDto, OperatingMessagesDto } from './operating-hours.dto';
import { AuthPolicyValueDto, InquiryPolicyValueDto, SlackNotificationValueDto } from './update-security-tab.request.dto';

export class OperationHolidaysResponseDto {
  @ApiProperty({ type: [OperatingHolidayItemDto] })
  holidays!: OperatingHolidayItemDto[];
}

export class GetAdminSystemConfigResponseDto {
  @ApiProperty({ type: OperatingHoursDto })
  'operation.hours'?: OperatingHoursDto;

  @ApiProperty({ type: OperationHolidaysResponseDto })
  'operation.holidays'?: OperationHolidaysResponseDto;

  @ApiProperty({ type: OperatingMessagesDto })
  'operation.messages'?: OperatingMessagesDto;

  @ApiProperty({ type: OperatingMaintenanceDto })
  maintenance?: OperatingMaintenanceDto;

  @ApiProperty({ type: AuthPolicyValueDto })
  'auth.policy'?: AuthPolicyValueDto;

  @ApiProperty({ type: SlackNotificationValueDto })
  'notification.slack'?: SlackNotificationValueDto;

  @ApiProperty({ type: InquiryPolicyValueDto })
  'inquiry.policy'?: InquiryPolicyValueDto;

  constructor(configs: Array<Pick<SystemConfig, 'key' | 'value'>> = []) {
    Object.assign(this, Object.fromEntries(configs.map((config) => [config.key, config.value])));
  }
}
