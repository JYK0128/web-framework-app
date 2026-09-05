import type { InquiryConfigDto } from './inquiryConfigDto';
import type { MaintenanceConfigDto } from './maintenanceConfigDto';
import type { OperatingHolidayItemDto } from './operatingHolidayItemDto';
import type { OperatingHoursUpdateDto } from './operatingHoursUpdateDto';
import type { OperatingMessagesDto } from './operatingMessagesDto';
import type { SecurityConfigDto } from './securityConfigDto';

export interface UpdateOperationsDto {
  hours?: OperatingHoursUpdateDto;
  holidays?: OperatingHolidayItemDto[];
  messages?: OperatingMessagesDto;
}

export interface UpdateSystemConfigRequestDto {
  /** 운영 설정 (시간, 공휴일, 안내메시지) */
  operation?: UpdateOperationsDto;
  /** 시스템 점검 설정 */
  maintenance?: MaintenanceConfigDto;
  /** 보안 정책 설정 */
  security?: SecurityConfigDto;
  /** 1:1 문의 정책 및 알림 연동 */
  inquiry?: InquiryConfigDto;
}

export interface UpdateSystemConfigResponseDto {
  ok: boolean;
}
