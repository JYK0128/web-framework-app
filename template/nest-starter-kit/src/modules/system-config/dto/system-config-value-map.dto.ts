import type { OperationHolidaysResponseDto } from './get-admin-system-config.response.dto';
import type { OperatingHoursDto, OperatingMaintenanceDto, OperatingMessagesDto } from './operating-hours.dto';
import type { AuthPolicyValueDto, InquiryPolicyValueDto, SlackNotificationValueDto } from './update-security-tab.request.dto';

/**
 * SystemConfigKey와 해당 설정의 Value DTO 1:1 매핑 타입
 */
export interface SystemConfigValueMap {
  'operation.hours': OperatingHoursDto
  'operation.holidays': OperationHolidaysResponseDto
  'operation.messages': OperatingMessagesDto
  'maintenance': OperatingMaintenanceDto
  'auth.policy': AuthPolicyValueDto
  'notification.slack': SlackNotificationValueDto
  'inquiry.policy': InquiryPolicyValueDto
}
